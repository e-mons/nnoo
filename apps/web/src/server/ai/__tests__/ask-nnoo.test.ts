import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  AskNnooToolExecutor,
  AskNnooNumericGuard,
  AskNnooAssistantService,
  ASK_NNOO_TOOLS,
} from '../assistant';
import { MockGeminiClient } from '../gemini/client';
import type { StructuredAskNnooResponse } from '@nnoo/contracts';

// Mock Supabase Builder Helper
function createMockQueryBuilder(defaultData: any = null, count: number = 0) {
  const builder: any = {
    select: () => builder,
    insert: (payload: any) => ({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              id: 'mock-msg-' + Math.random().toString(36).substring(2, 7),
              conversation_id: payload.conversation_id || 'conv-123',
              business_id: payload.business_id || 'biz-123',
              owner_user_id: payload.owner_user_id || 'user-123',
              role: payload.role || 'assistant',
              user_text: payload.user_text || null,
              assistant_response_payload: payload.assistant_response_payload || null,
              source_keys: payload.source_keys || ['SALES_REPORT'],
              required_capabilities: payload.required_capabilities || ['sales.view'],
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
      }),
    }),
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lte: () => builder,
    ilike: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => Promise.resolve({ data: defaultData || { id: 'conv-123', title: 'Test Conv' }, error: null }),
    maybeSingle: () => Promise.resolve({ data: defaultData, error: null }),
    then: (resolve: any) => resolve({ data: Array.isArray(defaultData) ? defaultData : [], count, error: null }),
  };
  return builder;
}

// Mock Supabase Client Factory
function createMockSupabase(tableOverrides: Record<string, any> = {}) {
  const mockFrom = (table: string) => {
    if (tableOverrides[table]) {
      return tableOverrides[table];
    }
    if (table === 'expenses') {
      return createMockQueryBuilder([
        { id: 'exp-1', total_minor: 15000000, expense_categories: { id: 'cat-1', name: 'Rent' } },
        { id: 'exp-2', total_minor: 5000000, expense_categories: { id: 'cat-2', name: 'Fuel' } },
      ]);
    }
    if (table === 'sales') {
      return createMockQueryBuilder([
        { id: 'sale-1', sale_number: 'SAL-001', effective_date: '2026-08-01', total_minor: 2500000, customers: { id: 'cust-1', name: 'Chidi Okonkwo' } },
      ]);
    }
    if (table === 'inventory_positions') {
      return createMockQueryBuilder([
        { id: 'pos-1', quantity_on_hand: 2, inventory_value_minor: 2000000, catalog_items: { id: 'item-1', name: 'Premium Rice', sku: 'RIC-01', low_stock_threshold: 5 } },
      ]);
    }
    if (table === 'invoices') {
      return createMockQueryBuilder([
        { id: 'inv-1', invoice_number: 'INV-101', invoice_status: 'sent', total_minor: 12000000, due_date: '2026-07-01', customers: { id: 'cust-1', name: 'Acme Ltd' } },
      ]);
    }
    if (table === 'customers') {
      return createMockQueryBuilder([
        { id: 'cust-1', name: 'Chidi Okonkwo', customer_type: 'individual', status: 'active' },
      ]);
    }
    if (table === 'catalog_items') {
      return createMockQueryBuilder([
        { id: 'item-1', name: 'Premium Rice', sku: 'RIC-01', selling_price_minor: 4500000, inventory_positions: [{ quantity_on_hand: 10 }] },
      ]);
    }
    return createMockQueryBuilder();
  };

  const mockRpc = (fnName: string) => {
    if (fnName === 'get_dashboard_performance_metrics') {
      return Promise.resolve({
        data: {
          net_sales_minor: 150000000,
          gross_sales_minor: 155000000,
          refunds_minor: 5000000,
          cogs_minor: 80000000,
          gross_profit_minor: 70000000,
          operating_expenses_minor: 30000000,
          operating_result_minor: 40000000,
          sales_count: 42,
          average_sale_minor: 3571400,
        },
        error: null,
      });
    }
    if (fnName === 'get_dashboard_current_position') {
      return Promise.resolve({
        data: {
          accounts_receivable_minor: 45000000,
          accounts_payable_minor: 25000000,
          inventory_value_minor: 350000000,
          low_stock_count: 3,
          overdue_invoices_count: 2,
        },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  };

  return {
    from: mockFrom,
    rpc: mockRpc,
  } as any;
}

describe('Tranche 3 Prompt 5: Ask NNOO — Production Business AI Assistant', () => {
  test('1. Tool Registry & Declarations: defines all 11 allowlisted read-only tools and validates params', () => {
    const toolKeys = Object.keys(ASK_NNOO_TOOLS);
    assert.strictEqual(toolKeys.length, 11);
    assert.ok(toolKeys.includes('getBusinessOverview'));
    assert.ok(toolKeys.includes('getSalesSummary'));
    assert.ok(toolKeys.includes('getProfitabilitySummary'));
    assert.ok(toolKeys.includes('getExpenseSummary'));
    assert.ok(toolKeys.includes('getReceivablesSummary'));
    assert.ok(toolKeys.includes('getPayablesSummary'));
    assert.ok(toolKeys.includes('getInventoryStatus'));
    assert.ok(toolKeys.includes('getInvoiceStatus'));
    assert.ok(toolKeys.includes('getBookkeeperStatus'));
    assert.ok(toolKeys.includes('lookupCustomer'));
    assert.ok(toolKeys.includes('lookupProduct'));

    // Reject invalid period parameter
    const schema = ASK_NNOO_TOOLS.getSalesSummary.paramSchema;
    const invalidRes = schema.safeParse({ period: 'unknown_period' });
    assert.strictEqual(invalidRes.success, false);

    // Accept valid period parameter
    const validRes = schema.safeParse({ period: 'this_month' });
    assert.strictEqual(validRes.success, true);
  });

  test('2. Tool Authorization Preflights: owner permitted, sales_staff forbidden on profitability', async () => {
    const supabase = createMockSupabase();

    // Owner allowed
    const ownerOutput = await AskNnooToolExecutor.executeTool(
      'getProfitabilitySummary',
      { period: 'this_month' },
      {
        supabase,
        businessId: 'biz-123',
        userId: 'user-1',
        userRole: 'owner',
        currencyCode: 'NGN',
        timezone: 'Africa/Lagos',
      }
    );
    assert.strictEqual(ownerOutput.toolName, 'getProfitabilitySummary');
    assert.ok(ownerOutput.facts.some((f) => f.key === 'profitability.gross_profit'));

    // Sales staff blocked on profitability
    await assert.rejects(
      async () => {
        await AskNnooToolExecutor.executeTool(
          'getProfitabilitySummary',
          { period: 'this_month' },
          {
            supabase,
            businessId: 'biz-123',
            userId: 'user-2',
            userRole: 'sales_staff',
          }
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'ASK_NNOO_FORBIDDEN');
        assert.match(err.message, /not permitted to access tool/);
        return true;
      }
    );

    // Sales staff allowed on sales
    const salesOutput = await AskNnooToolExecutor.executeTool(
      'getSalesSummary',
      { period: 'this_month' },
      {
        supabase,
        businessId: 'biz-123',
        userId: 'user-2',
        userRole: 'sales_staff',
      }
    );
    assert.strictEqual(salesOutput.toolName, 'getSalesSummary');
    assert.ok(salesOutput.facts.some((f) => f.key === 'sales.net_sales'));
  });

  test('3. Deterministic Tools Execution: getBusinessOverview, getExpenseSummary, and getReceivablesSummary', async () => {
    const supabase = createMockSupabase();

    // 1. Business Overview
    const overview = await AskNnooToolExecutor.executeTool(
      'getBusinessOverview',
      {},
      { supabase, businessId: 'biz-123', userId: 'user-1', userRole: 'owner' }
    );
    assert.strictEqual(overview.sourceKey, 'BUSINESS_OVERVIEW');
    assert.ok(overview.facts.some((f) => f.key === 'overview.net_sales'));
    assert.ok(overview.facts.some((f) => f.key === 'overview.accounts_receivable'));

    // 2. Expense Summary
    const expenses = await AskNnooToolExecutor.executeTool(
      'getExpenseSummary',
      { period: 'this_month' },
      { supabase, businessId: 'biz-123', userId: 'user-1', userRole: 'owner' }
    );
    assert.strictEqual(expenses.sourceKey, 'EXPENSE_REPORT');
    assert.ok(expenses.facts.some((f) => f.key === 'expenses.total_operating'));

    // 3. Receivables Summary (Opaque Candidate Keys)
    const receivables = await AskNnooToolExecutor.executeTool(
      'getReceivablesSummary',
      {},
      { supabase, businessId: 'biz-123', userId: 'user-1', userRole: 'owner' }
    );
    assert.strictEqual(receivables.sourceKey, 'RECEIVABLES');
    assert.ok(receivables.entities.some((e) => e.key === 'customer_receivable_1'));
    assert.strictEqual(receivables.entities[0].displayName, 'Chidi Okonkwo');
  });

  test('4. Inventory, Invoices, and Catalog Search Tools', async () => {
    const supabase = createMockSupabase();

    // 1. Inventory Status
    const invStatus = await AskNnooToolExecutor.executeTool(
      'getInventoryStatus',
      {},
      { supabase, businessId: 'biz-123', userId: 'user-1', userRole: 'owner' }
    );
    assert.strictEqual(invStatus.sourceKey, 'INVENTORY');
    assert.ok(invStatus.facts.some((f) => f.key === 'inventory.low_stock_count'));

    // 2. Invoice Status
    const invoiceStatus = await AskNnooToolExecutor.executeTool(
      'getInvoiceStatus',
      {},
      { supabase, businessId: 'biz-123', userId: 'user-1', userRole: 'owner' }
    );
    assert.strictEqual(invoiceStatus.sourceKey, 'INVOICES');
    assert.ok(invoiceStatus.facts.some((f) => f.key === 'invoices.unpaid_count'));

    // 3. Lookup Product
    const productLookup = await AskNnooToolExecutor.executeTool(
      'lookupProduct',
      { query: 'Rice' },
      { supabase, businessId: 'biz-123', userId: 'user-1', userRole: 'sales_staff' }
    );
    assert.strictEqual(productLookup.sourceKey, 'INVENTORY');
    assert.ok(productLookup.entities.some((e) => e.displayName === 'Premium Rice'));
  });

  test('5. Fact Key Allowlist: numeric guard validates facts and blocks unverified keys', () => {
    const availableFacts = new Set(['sales.net_sales', 'sales.gross_sales']);
    const availableEntities = new Set(['customer_1', 'product_1']);
    const allowedSources = new Set<any>(['SALES_REPORT']);
    const allowableActions = new Set<any>(['OPEN_SALES_REPORT']);

    const validResponse: StructuredAskNnooResponse = {
      schemaVersion: '1.0.0',
      responseType: 'ANSWER',
      headline: 'Sales overview for this month',
      segments: [
        { type: 'TEXT', text: 'Your Net Sales are ' },
        { type: 'FACT', factKey: 'sales.net_sales' },
      ],
      factKeys: ['sales.net_sales'],
      entityKeys: [],
      sourceKeys: ['SALES_REPORT'],
      actionKeys: ['OPEN_SALES_REPORT'],
      followUpQuestions: ['How does this compare to last month?'],
      requiredCapabilities: ['sales.view'],
    };

    assert.doesNotThrow(() => {
      AskNnooNumericGuard.validate(
        validResponse,
        availableFacts,
        availableEntities,
        allowedSources,
        allowableActions
      );
    });

    const invalidResponse: StructuredAskNnooResponse = {
      schemaVersion: '1.0.0',
      responseType: 'ANSWER',
      headline: 'Sales overview',
      segments: [
        { type: 'TEXT', text: 'Your profit is ' },
        { type: 'FACT', factKey: 'profitability.gross_profit' },
      ],
      factKeys: ['profitability.gross_profit'],
      entityKeys: [],
      sourceKeys: ['SALES_REPORT'],
      actionKeys: ['OPEN_SALES_REPORT'],
      followUpQuestions: [],
      requiredCapabilities: ['sales.view'],
    };

    assert.throws(
      () => {
        AskNnooNumericGuard.validate(
          invalidResponse,
          availableFacts,
          availableEntities,
          allowedSources,
          allowableActions
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'ASK_NNOO_INVALID_RESPONSE');
        assert.match(err.message, /referenced unknown or unauthorized factKey/);
        return true;
      }
    );
  });

  test('6. Security Prohibitions: blocks Business Health Scores, Credit Ratings, and Forecasting', () => {
    const availableFacts = new Set(['sales.net_sales']);
    const availableEntities = new Set<string>();
    const allowedSources = new Set<any>(['SALES_REPORT']);
    const allowableActions = new Set<any>(['OPEN_SALES_REPORT']);

    // Prohibited Health Score
    assert.throws(
      () => {
        AskNnooNumericGuard.validate(
          {
            schemaVersion: '1.0.0',
            responseType: 'ANSWER',
            headline: 'Your Business Health Score is 88/100',
            segments: [{ type: 'TEXT', text: 'You scored 88/100 on financial stability.' }],
            factKeys: ['sales.net_sales'],
            entityKeys: [],
            sourceKeys: ['SALES_REPORT'],
            actionKeys: ['OPEN_SALES_REPORT'],
            followUpQuestions: [],
            requiredCapabilities: ['sales.view'],
          },
          availableFacts,
          availableEntities,
          allowedSources,
          allowableActions
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'ASK_NNOO_INVALID_RESPONSE');
        assert.match(err.message, /prohibited content/);
        return true;
      }
    );

    // Prohibited Credit Rating
    assert.throws(
      () => {
        AskNnooNumericGuard.validate(
          {
            schemaVersion: '1.0.0',
            responseType: 'ANSWER',
            headline: 'Credit Rating Assessment',
            segments: [{ type: 'TEXT', text: 'Based on this, you qualify for a loan from our partners.' }],
            factKeys: ['sales.net_sales'],
            entityKeys: [],
            sourceKeys: ['SALES_REPORT'],
            actionKeys: ['OPEN_SALES_REPORT'],
            followUpQuestions: [],
            requiredCapabilities: ['sales.view'],
          },
          availableFacts,
          availableEntities,
          allowedSources,
          allowableActions
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'ASK_NNOO_INVALID_RESPONSE');
        assert.match(err.message, /prohibited content/);
        return true;
      }
    );

    // Prohibited Future Revenue Forecast
    assert.throws(
      () => {
        AskNnooNumericGuard.validate(
          {
            schemaVersion: '1.0.0',
            responseType: 'ANSWER',
            headline: 'Sales Forecast',
            segments: [{ type: 'TEXT', text: 'We predict that you will make ₦10M next month.' }],
            factKeys: ['sales.net_sales'],
            entityKeys: [],
            sourceKeys: ['SALES_REPORT'],
            actionKeys: ['OPEN_SALES_REPORT'],
            followUpQuestions: [],
            requiredCapabilities: ['sales.view'],
          },
          availableFacts,
          availableEntities,
          allowedSources,
          allowableActions
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'ASK_NNOO_INVALID_RESPONSE');
        assert.match(err.message, /prohibited content/);
        return true;
      }
    );
  });

  test('7. Mutation Safety: refuses expense/refund/sale creation and returns MUTATION_REQUIRES_WORKFLOW', async () => {
    const supabase = createMockSupabase();

    // 1. Expense mutation attempt
    const expResult = await AskNnooAssistantService.processMessage({
      supabase,
      businessId: 'biz-123',
      userId: 'user-1',
      userRole: 'owner',
      message: 'Record ₦45,000 for shop generator diesel fuel',
      idempotencyKey: 'mut-test-1',
    });
    assert.strictEqual(expResult.assistantMessage.assistantResponsePayload?.responseType, 'MUTATION_REQUIRES_WORKFLOW');
    assert.ok(expResult.assistantMessage.assistantResponsePayload?.actionKeys.includes('OPEN_AI_BOOKKEEPER'));

    // 2. Refund mutation attempt
    const refResult = await AskNnooAssistantService.processMessage({
      supabase,
      businessId: 'biz-123',
      userId: 'user-1',
      userRole: 'owner',
      message: 'Refund customer Chidi ₦12,000 for returned shoes',
      idempotencyKey: 'mut-test-2',
    });
    assert.strictEqual(refResult.assistantMessage.assistantResponsePayload?.responseType, 'MUTATION_REQUIRES_WORKFLOW');
    assert.ok(refResult.assistantMessage.assistantResponsePayload?.actionKeys.includes('OPEN_SALES_REPORT'));

    // 3. Sale mutation attempt
    const saleResult = await AskNnooAssistantService.processMessage({
      supabase,
      businessId: 'biz-123',
      userId: 'user-1',
      userRole: 'owner',
      message: 'Create sale for 5 cartons of biscuits to Walk-in Customer',
      idempotencyKey: 'mut-test-3',
    });
    assert.strictEqual(saleResult.assistantMessage.assistantResponsePayload?.responseType, 'MUTATION_REQUIRES_WORKFLOW');
    assert.ok(saleResult.assistantMessage.assistantResponsePayload?.actionKeys.includes('CREATE_SALE'));
  });

  test('8. Role Downgrade Masking Security: masks privileged messages for downgraded roles', async () => {
    const privilegedPayload = {
      schemaVersion: '1.0.0',
      responseType: 'ANSWER' as const,
      headline: 'Gross Profit is ₦5,400,000',
      segments: [{ type: 'FACT' as const, factKey: 'profitability.gross_profit', formattedValue: '₦5,400,000' }],
      facts: [{ key: 'profitability.gross_profit', label: 'Gross Profit', formattedValue: '₦5,400,000', rawValue: 540000000, domain: 'profitability' }],
      entities: [],
      sourceKeys: ['PROFITABILITY_REPORT' as const],
      actionKeys: ['OPEN_PROFITABILITY_REPORT' as const],
      followUpQuestions: [],
    };

    const mockConvBuilder: any = {
      select: () => mockConvBuilder,
      eq: () => mockConvBuilder,
      single: () =>
        Promise.resolve({
          data: {
            id: 'conv-123',
            business_id: 'biz-123',
            owner_user_id: 'user-1',
            title: 'Profit Inquiry',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
          },
          error: null,
        }),
    };

    const mockMsgBuilder: any = {
      select: () => mockMsgBuilder,
      eq: () => mockMsgBuilder,
      order: () =>
        Promise.resolve({
          data: [
            {
              id: 'msg-1',
              conversation_id: 'conv-123',
              business_id: 'biz-123',
              owner_user_id: 'user-1',
              role: 'assistant',
              user_text: null,
              assistant_response_payload: privilegedPayload,
              source_keys: ['PROFITABILITY_REPORT'],
              required_capabilities: ['reports.profitability.view'],
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
    };

    const mockSupabase = {
      from: (table: string) => {
        if (table === 'ai_conversations') return mockConvBuilder;
        if (table === 'ai_messages') return mockMsgBuilder;
        return createMockQueryBuilder();
      },
    } as any;

    // Owner views unredacted message
    const ownerResult = await AskNnooAssistantService.getConversation(
      mockSupabase,
      'biz-123',
      'user-1',
      'owner',
      'conv-123'
    );
    assert.strictEqual(ownerResult.messages[0].assistantResponsePayload?.isRedactedByRoleDowngrade, undefined);
    assert.strictEqual(ownerResult.messages[0].assistantResponsePayload?.headline, 'Gross Profit is ₦5,400,000');

    // Downgraded sales_staff views redacted message
    const salesResult = await AskNnooAssistantService.getConversation(
      mockSupabase,
      'biz-123',
      'user-1',
      'sales_staff',
      'conv-123'
    );
    assert.strictEqual(salesResult.messages[0].assistantResponsePayload?.isRedactedByRoleDowngrade, true);
    assert.strictEqual(salesResult.messages[0].assistantResponsePayload?.responseType, 'FORBIDDEN');
    assert.match(
      salesResult.messages[0].assistantResponsePayload?.headline || '',
      /This earlier response is no longer available because your Business permissions have changed/
    );
    assert.strictEqual(salesResult.messages[0].assistantResponsePayload?.facts.length, 0);
  });

  test('9. End-to-End Assistant Turn: executes tool, mock Gemini, and server fact substitution', async () => {
    const mockGemini = new MockGeminiClient(() => ({
      schemaVersion: '1.0.0',
      responseType: 'ANSWER',
      headline: 'Sales performance for this month',
      segments: [
        { type: 'TEXT', text: 'Your Net Sales this month reached ' },
        { type: 'FACT', factKey: 'sales.net_sales' },
        { type: 'TEXT', text: ' across ' },
        { type: 'FACT', factKey: 'sales.count' },
        { type: 'TEXT', text: ' completed customer sales.' },
      ],
      factKeys: ['sales.net_sales', 'sales.count'],
      entityKeys: [],
      sourceKeys: ['SALES_REPORT'],
      actionKeys: ['OPEN_SALES_REPORT'],
      followUpQuestions: ['Who owes me money right now?'],
      requiredCapabilities: ['sales.view'],
    }));

    const supabase = createMockSupabase();
    const result = await AskNnooAssistantService.processMessage({
      supabase,
      businessId: 'biz-123',
      userId: 'user-1',
      userRole: 'owner',
      conversationId: 'conv-123',
      message: 'How much did I sell this month?',
      idempotencyKey: 'e2e-sales-test',
      geminiClient: mockGemini,
    });

    assert.strictEqual(result.conversationId, 'conv-123');
    assert.strictEqual(result.userMessage.userText, 'How much did I sell this month?');
    assert.strictEqual(result.assistantMessage.assistantResponsePayload?.responseType, 'ANSWER');

    // Verify server fact substitution
    const factSeg = result.assistantMessage.assistantResponsePayload?.segments.find(
      (s) => s.type === 'FACT' && s.factKey === 'sales.net_sales'
    );
    assert.strictEqual(factSeg?.formattedValue, '₦1,500,000');

    // Verify fact bundle and sources
    assert.ok((result.assistantMessage.assistantResponsePayload?.facts.length || 0) > 0);
    assert.ok(result.assistantMessage.assistantResponsePayload?.sourceKeys.includes('SALES_REPORT'));
    assert.ok(result.assistantMessage.assistantResponsePayload?.actionKeys.includes('OPEN_SALES_REPORT'));
  });
});
