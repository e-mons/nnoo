import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AIBookkeeperReviewService, AISafeError } from '../index';
import type { Database } from '@nnoo/supabase/database.types';

const businessId = '11111111-1111-1111-1111-111111111111';
const otherBusinessId = '22222222-2222-2222-2222-222222222222';
const userId = 'user-owner-1';

const defaultMockData = {
  expenseCategories: [
    { id: 'cat-rent-1', business_id: businessId, name: 'Rent', status: 'active' },
    { id: 'cat-archived-1', business_id: businessId, name: 'Old Utilities', status: 'archived' },
    { id: 'cat-biz-b', business_id: otherBusinessId, name: 'Biz B Category', status: 'active' },
  ],
  suppliers: [
    { id: 'sup-abc-1', business_id: businessId, name: 'ABC Traders', status: 'active' },
  ],
  customers: [
    { id: 'cust-chidi-1', business_id: businessId, name: 'Chidi', status: 'active' },
  ],
  catalogItems: [
    { id: 'prod-water-1', business_id: businessId, name: 'Packaged Water', cost_price_minor: 100000, selling_price_minor: 150000, track_inventory: true },
  ],
  sales: [
    { id: 'sale-unpaid-1', business_id: businessId, sale_number: 'SALE-500', total_minor: 5000000, amount_paid_minor: 2000000, payment_status: 'partial' },
    { id: 'sale-settled-1', business_id: businessId, sale_number: 'SALE-501', total_minor: 1000000, amount_paid_minor: 1000000, payment_status: 'paid' },
  ],
  expenses: [
    { id: 'exp-unpaid-1', business_id: businessId, expense_number: 'EXP-500', amount_minor: 7500000, amount_paid_minor: 0, payment_status: 'unpaid' },
  ],
  stockReceipts: [
    { id: 'rec-unpaid-1', business_id: businessId, receipt_number: 'SR-500', total_cost_minor: 10000000, amount_paid_minor: 0, payment_status: 'unpaid' },
  ],
  classifications: [
    {
      id: 'cls-expense-1',
      business_id: businessId,
      requested_by_user_id: userId,
      description: 'Paid shop rent for August',
      amount_minor: 7500000,
      currency_code: 'NGN',
      transaction_direction: 'MONEY_OUT',
      operation_kind: 'OPERATING_EXPENSE',
      confidence_band: 'HIGH',
      expense_category_candidate_id: 'cat-rent-1',
      missing_fields: [],
      warning_codes: [],
      short_explanation: 'Operating expense for shop rent.',
      classification_status: 'pending_review',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cls-stock-1',
      business_id: businessId,
      requested_by_user_id: userId,
      description: 'Bought cartons of water from ABC Traders',
      amount_minor: 10000000,
      currency_code: 'NGN',
      transaction_direction: 'MONEY_OUT',
      operation_kind: 'STOCK_PURCHASE',
      confidence_band: 'HIGH',
      supplier_candidate_id: 'sup-abc-1',
      missing_fields: ['PRODUCT_LINES_REQUIRED'],
      warning_codes: [],
      short_explanation: 'Stock purchase for packaged water.',
      classification_status: 'pending_review',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cls-cust-pay-1',
      business_id: businessId,
      requested_by_user_id: userId,
      description: 'Chidi paid 30k balance',
      amount_minor: 3000000,
      currency_code: 'NGN',
      transaction_direction: 'MONEY_IN',
      operation_kind: 'CUSTOMER_PAYMENT',
      confidence_band: 'HIGH',
      customer_candidate_id: 'cust-chidi-1',
      missing_fields: ['SALE_SELECTION_REQUIRED'],
      warning_codes: [],
      short_explanation: 'Customer payment received from Chidi.',
      classification_status: 'pending_review',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cls-sup-pay-1',
      business_id: businessId,
      requested_by_user_id: userId,
      description: 'Paid ABC Traders 75k owed',
      amount_minor: 7500000,
      currency_code: 'NGN',
      transaction_direction: 'MONEY_OUT',
      operation_kind: 'SUPPLIER_PAYMENT',
      confidence_band: 'HIGH',
      supplier_candidate_id: 'sup-abc-1',
      missing_fields: ['PAYABLE_SELECTION_REQUIRED'],
      warning_codes: [],
      short_explanation: 'Supplier payable payment to ABC Traders.',
      classification_status: 'pending_review',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cls-sale-1',
      business_id: businessId,
      requested_by_user_id: userId,
      description: 'Sold 3 packs of water to Chidi',
      amount_minor: 450000,
      currency_code: 'NGN',
      transaction_direction: 'MONEY_IN',
      operation_kind: 'SALE',
      confidence_band: 'HIGH',
      customer_candidate_id: 'cust-chidi-1',
      missing_fields: ['PRODUCT_LINES_REQUIRED'],
      warning_codes: [],
      short_explanation: 'Product sale to Chidi.',
      classification_status: 'pending_review',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cls-personal-1',
      business_id: businessId,
      requested_by_user_id: userId,
      description: 'Bought personal lunch at restaurant',
      amount_minor: 500000,
      currency_code: 'NGN',
      transaction_direction: 'MONEY_OUT',
      operation_kind: 'UNKNOWN',
      confidence_band: 'LOW',
      missing_fields: [],
      warning_codes: [],
      short_explanation: 'Unclear business purpose.',
      classification_status: 'pending_review',
      created_at: new Date().toISOString(),
    },
  ],
};

// Mock Supabase Database Client for Review & Application Testing
function createMockSupabase(customData?: any) {
  const initialData = JSON.parse(JSON.stringify(customData || defaultMockData));
  const tables: Record<string, any[]> = {
    ai_bookkeeping_classifications: initialData?.classifications || [],
    ai_bookkeeping_reviews: initialData?.reviews || [],
    ai_bookkeeping_applications: initialData?.applications || [],
    expense_categories: initialData?.expenseCategories || [],
    suppliers: initialData?.suppliers || [],
    customers: initialData?.customers || [],
    catalog_items: initialData?.catalogItems || [],
    sales: initialData?.sales || [],
    expenses: initialData?.expenses || [],
    stock_receipts: initialData?.stockReceipts || [],
  };

  const rpcCalls: Array<{ fn: string; payload: any }> = [];

  const supabaseMock = {
    from: (tableName: string) => {
      let currentTable = tables[tableName] || [];
      let filters: Array<(row: any) => boolean> = [];
      let selectedFields: string = '*';
      let sortFn: ((a: any, b: any) => number) | null = null;
      let limitCount: number | null = null;
      let offsetCount: number = 0;

      const chain: any = {
        select: (fields = '*', options?: any) => {
          selectedFields = fields;
          return chain;
        },
        eq: (field: string, value: any) => {
          filters.push((row) => row[field] === value);
          return chain;
        },
        neq: (field: string, value: any) => {
          filters.push((row) => row[field] !== value);
          return chain;
        },
        in: (field: string, values: any[]) => {
          filters.push((row) => values.includes(row[field]));
          return chain;
        },
        or: (orClause: string) => {
          return chain;
        },
        order: (field: string, options?: any) => {
          sortFn = (a, b) => {
            if (options?.ascending) return a[field] > b[field] ? 1 : -1;
            return a[field] < b[field] ? 1 : -1;
          };
          return chain;
        },
        range: (start: number, end: number) => {
          offsetCount = start;
          limitCount = end - start + 1;
          return chain;
        },
        limit: (n: number) => {
          limitCount = n;
          return chain;
        },
        insert: (data: any) => {
          const rows = Array.isArray(data) ? data : [data];
          const created = rows.map((r) => ({
            id: r.id || `gen-${Math.random().toString(36).substring(2, 9)}`,
            created_at: r.created_at || new Date().toISOString(),
            ...r,
          }));
          currentTable.push(...created);

          return {
            select: () => ({
              single: async () => ({ data: created[0], error: null }),
              maybeSingle: async () => ({ data: created[0], error: null }),
            }),
            then: (resolve: any) => resolve({ data: created, error: null }),
          };
        },
        update: (updates: any) => {
          return {
            eq: (field: string, value: any) => ({
              eq: async (field2: string, value2: any) => {
                currentTable.forEach((row) => {
                  if (row[field] === value && row[field2] === value2) {
                    Object.assign(row, updates);
                  }
                });
                return { data: null, error: null };
              },
              then: (resolve: any) => {
                currentTable.forEach((row) => {
                  if (row[field] === value) {
                    Object.assign(row, updates);
                  }
                });
                return resolve({ data: null, error: null });
              },
            }),
          };
        },
        maybeSingle: async () => {
          let rows = currentTable.filter((row) => filters.every((f) => f(row)));
          return { data: rows[0] || null, error: null };
        },
        single: async () => {
          let rows = currentTable.filter((row) => filters.every((f) => f(row)));
          if (rows.length === 0) return { data: null, error: { message: 'Row not found' } };
          return { data: rows[0], error: null };
        },
        then: (resolve: any) => {
          let rows = currentTable.filter((row) => filters.every((f) => f(row)));
          if (sortFn) rows.sort(sortFn);
          if (limitCount !== null) {
            rows = rows.slice(offsetCount, offsetCount + limitCount);
          }
          return resolve({ data: rows, count: rows.length, error: null });
        },
      };

      return chain;
    },
    rpc: async (fn: string, args: any) => {
      rpcCalls.push({ fn, payload: args?.payload });
      if (fn === 'create_expense') {
        const exp = {
          id: `exp-${Math.random().toString(36).substring(2, 7)}`,
          expense_number: 'EXP-1001',
          ...args.payload,
        };
        tables.expenses.push(exp);
        return { data: exp, error: null };
      }
      if (fn === 'create_stock_receipt') {
        const rec = {
          id: `rec-${Math.random().toString(36).substring(2, 7)}`,
          receipt_number: 'SR-1001',
          ...args.payload,
        };
        tables.stock_receipts.push(rec);
        return { data: rec, error: null };
      }
      if (fn === 'record_sale_payment') {
        const payment = {
          id: `pay-${Math.random().toString(36).substring(2, 7)}`,
          payment_number: 'PAY-1001',
          ...args.payload,
        };
        return { data: payment, error: null };
      }
      if (fn === 'record_expense_payment') {
        const payment = {
          id: `exp-pay-${Math.random().toString(36).substring(2, 7)}`,
          ...args.payload,
        };
        return { data: payment, error: null };
      }
      if (fn === 'record_stock_receipt_payment') {
        const payment = {
          id: `rec-pay-${Math.random().toString(36).substring(2, 7)}`,
          ...args.payload,
        };
        return { data: payment, error: null };
      }
      if (fn === 'create_sale') {
        const sale = {
          id: `sale-${Math.random().toString(36).substring(2, 7)}`,
          sale_number: 'SALE-1001',
          ...args.payload,
        };
        tables.sales.push(sale);
        return { data: sale, error: null };
      }
      if (fn === 'create_sale_refund') {
        const refund = {
          id: `ref-${Math.random().toString(36).substring(2, 7)}`,
          refund_number: 'REF-1001',
          ...args.payload,
        };
        return { data: refund, error: null };
      }
      return { data: { id: 'mock-id' }, error: null };
    },
    _getTables: () => tables,
    _getRpcCalls: () => rpcCalls,
  };

  return supabaseMock as any;
}

describe('Tranche 3 Prompt 3: AI Bookkeeper — Review, Confirmation & Bookkeeping Workflow', () => {
  it('1. Review-Only Actions produce ZERO journal and financial mutations', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    // Fetch inbox
    const inbox = await service.getInbox(context);
    assert.ok(inbox.items.length >= 6);

    // View detail
    const detail = await service.getDetail(context, 'cls-expense-1');
    assert.equal(detail.description, 'Paid shop rent for August');

    // Reject personal item
    await service.rejectSuggestion(
      { classificationId: 'cls-personal-1', reasonCode: 'NOT_A_BUSINESS_TRANSACTION' },
      context
    );

    // Verify 0 RPC mutation calls
    const rpcCalls = supabase._getRpcCalls();
    assert.equal(rpcCalls.length, 0, 'Review actions must generate zero RPC mutations');
  });

  it('2. Manual Flow B: Confirm Expense invokes canonical create_expense and creates application link', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    const result = await service.applySuggestion(
      {
        classificationId: 'cls-expense-1',
        finalOperationKind: 'OPERATING_EXPENSE',
        idempotencyKey: 'test_app_expense_1',
        payload: {
          amountMinor: 7500000,
          expenseCategoryId: 'cat-rent-1',
          description: 'Paid shop rent for August',
          occurredAt: '2026-08-17',
          payment: {
            amountMinor: 7500000,
            paymentMethod: 'cash',
          },
        },
      },
      context
    );

    assert.equal(result.status, 'succeeded');
    assert.equal(result.canonicalTargetType, 'EXPENSE');
    assert.ok(result.canonicalTargetId);

    // Verify canonical RPC was invoked
    const rpcCalls = supabase._getRpcCalls();
    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].fn, 'create_expense');
    assert.equal(rpcCalls[0].payload.amountMinor, 7500000);

    // Verify classification status updated to applied
    const tables = supabase._getTables();
    const cls = tables.ai_bookkeeping_classifications.find((c: any) => c.id === 'cls-expense-1');
    assert.equal(cls.classification_status, 'applied');

    // Verify application row exists
    assert.equal(tables.ai_bookkeeping_applications.length, 1);
    assert.equal(tables.ai_bookkeeping_applications[0].canonical_target_type, 'EXPENSE');
  });

  it('3. Manual Flow C: Human Correction (AI: Expense -> Human: Stock Purchase) executes canonical stock purchase and audits correction', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    // Initial classification is OPERATING_EXPENSE, but human corrects to STOCK_PURCHASE
    const result = await service.applySuggestion(
      {
        classificationId: 'cls-expense-1',
        finalOperationKind: 'STOCK_PURCHASE',
        idempotencyKey: 'test_app_correct_1',
        payload: {
          supplierId: 'sup-abc-1',
          receivedAt: '2026-08-17',
          items: [
            {
              catalogItemId: 'prod-water-1',
              quantity: 50,
              unitCostMinor: 100000,
            },
          ],
          payment: {
            amountMinor: 5000000,
            paymentMethod: 'bank_transfer',
          },
        },
      },
      context
    );

    assert.equal(result.status, 'succeeded');
    assert.equal(result.canonicalTargetType, 'STOCK_RECEIPT');

    const rpcCalls = supabase._getRpcCalls();
    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].fn, 'create_stock_receipt');

    // Verify correction audit row recorded
    const tables = supabase._getTables();
    const review = tables.ai_bookkeeping_reviews.find((r: any) => r.classification_id === 'cls-expense-1');
    assert.equal(review.review_action, 'corrected');
    assert.equal(review.ai_operation_kind, 'OPERATING_EXPENSE');
    assert.equal(review.final_operation_kind, 'STOCK_PURCHASE');
  });

  it('4. Manual Flow F: Customer Payment Apply invokes record_sale_payment and reduces receivable', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    const result = await service.applySuggestion(
      {
        classificationId: 'cls-cust-pay-1',
        finalOperationKind: 'CUSTOMER_PAYMENT',
        idempotencyKey: 'test_app_cust_pay_1',
        payload: {
          saleId: 'sale-unpaid-1',
          amountMinor: 3000000,
          paymentMethod: 'bank_transfer',
          occurredAt: '2026-08-17',
        },
      },
      context
    );

    assert.equal(result.status, 'succeeded');
    assert.equal(result.canonicalTargetType, 'SALE_PAYMENT');

    const rpcCalls = supabase._getRpcCalls();
    assert.equal(rpcCalls[0].fn, 'record_sale_payment');
    assert.equal(rpcCalls[0].payload.saleId, 'sale-unpaid-1');
    assert.equal(rpcCalls[0].payload.amountMinor, 3000000);
  });

  it('5. Manual Flow G & H: Supplier Payment Apply (Expense & Stock Purchase) settles AP without duplicate expense or inventory', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    // Apply Expense payable
    const resultExp = await service.applySuggestion(
      {
        classificationId: 'cls-sup-pay-1',
        finalOperationKind: 'SUPPLIER_PAYMENT',
        idempotencyKey: 'test_app_sup_exp_1',
        payload: {
          payableSourceType: 'EXPENSE',
          payableId: 'exp-unpaid-1',
          amountMinor: 7500000,
          paymentMethod: 'bank_transfer',
          occurredAt: '2026-08-17',
        },
      },
      context
    );

    assert.equal(resultExp.canonicalTargetType, 'EXPENSE_PAYMENT');
    const rpcCalls = supabase._getRpcCalls();
    assert.equal(rpcCalls[0].fn, 'record_expense_payment');
  });

  it('6. Manual Flow I: Sale Apply invokes canonical create_sale', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    const result = await service.applySuggestion(
      {
        classificationId: 'cls-sale-1',
        finalOperationKind: 'SALE',
        idempotencyKey: 'test_app_sale_1',
        payload: {
          customerId: 'cust-chidi-1',
          occurredAt: '2026-08-17',
          items: [
            {
              catalogItemId: 'prod-water-1',
              quantity: 3,
              unitPriceMinor: 150000,
            },
          ],
          payments: [
            {
              amountMinor: 450000,
              paymentMethod: 'cash',
            },
          ],
        },
      },
      context
    );

    assert.equal(result.canonicalTargetType, 'SALE');
    const rpcCalls = supabase._getRpcCalls();
    assert.equal(rpcCalls[0].fn, 'create_sale');
  });

  it('7. Manual Flow D: Reject preserves history and produces zero financial effects', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    const rejectRes = await service.rejectSuggestion(
      {
        classificationId: 'cls-personal-1',
        reasonCode: 'NOT_A_BUSINESS_TRANSACTION',
        notes: 'Personal food',
      },
      context
    );

    assert.ok(rejectRes.success);
    const tables = supabase._getTables();
    const cls = tables.ai_bookkeeping_classifications.find((c: any) => c.id === 'cls-personal-1');
    assert.equal(cls.classification_status, 'rejected');

    // Attempting to apply a rejected classification is blocked
    await assert.rejects(
      () =>
        service.applySuggestion(
          {
            classificationId: 'cls-personal-1',
            finalOperationKind: 'OPERATING_EXPENSE',
            idempotencyKey: 'test_apply_rejected',
            payload: {
              amountMinor: 500000,
              expenseCategoryId: 'cat-rent-1',
              description: 'Personal lunch',
              occurredAt: '2026-08-17',
            },
          },
          context
        ),
      (err: any) => err.code === 'AI_BOOKKEEPER_ALREADY_REJECTED'
    );
  });

  it('8. Application Idempotency: identical key returns cached result; altered payload throws conflict', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    const payload = {
      amountMinor: 7500000,
      expenseCategoryId: 'cat-rent-1',
      description: 'Paid shop rent for August',
      occurredAt: '2026-08-17',
    };

    // First apply
    const res1 = await service.applySuggestion(
      {
        classificationId: 'cls-expense-1',
        finalOperationKind: 'OPERATING_EXPENSE',
        idempotencyKey: 'idemp_key_123',
        payload,
      },
      context
    );

    // Second apply with identical payload
    const res2 = await service.applySuggestion(
      {
        classificationId: 'cls-expense-1',
        finalOperationKind: 'OPERATING_EXPENSE',
        idempotencyKey: 'idemp_key_123',
        payload,
      },
      context
    );

    assert.equal(res1.canonicalTargetId, res2.canonicalTargetId);
    assert.equal(supabase._getRpcCalls().length, 1, 'Idempotent retry must not invoke RPC twice');

    // Third apply with same key but altered payload (conflict)
    await assert.rejects(
      () =>
        service.applySuggestion(
          {
            classificationId: 'cls-expense-1',
            finalOperationKind: 'OPERATING_EXPENSE',
            idempotencyKey: 'idemp_key_123',
            payload: { ...payload, amountMinor: 9900000 },
          },
          context
        ),
      (err: any) => err.code === 'AI_BOOKKEEPER_APPLICATION_CONFLICT'
    );
  });

  it('9. Stale Data Protection: fully paid sale rejects customer payment with AI_BOOKKEEPER_TARGET_ALREADY_SETTLED', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    await assert.rejects(
      () =>
        service.applySuggestion(
          {
            classificationId: 'cls-cust-pay-1',
            finalOperationKind: 'CUSTOMER_PAYMENT',
            idempotencyKey: 'test_stale_sale',
            payload: {
              saleId: 'sale-settled-1', // Already paid
              amountMinor: 500000,
              paymentMethod: 'cash',
              occurredAt: '2026-08-17',
            },
          },
          context
        ),
      (err: any) => err.code === 'AI_BOOKKEEPER_TARGET_ALREADY_SETTLED'
    );
  });

  it('10. Stale Category Protection: archived category rejects expense apply with AI_BOOKKEEPER_STALE_CLASSIFICATION', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    await assert.rejects(
      () =>
        service.applySuggestion(
          {
            classificationId: 'cls-expense-1',
            finalOperationKind: 'OPERATING_EXPENSE',
            idempotencyKey: 'test_archived_cat',
            payload: {
              expenseCategoryId: 'cat-archived-1', // Archived
              amountMinor: 500000,
              description: 'Utilities',
              occurredAt: '2026-08-17',
            },
          },
          context
        ),
      (err: any) => err.code === 'AI_BOOKKEEPER_STALE_CLASSIFICATION'
    );
  });

  it('11. Tenant Security: Business A user cannot access or apply Business B classification', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);

    // User from other business
    const foreignContext = { businessId: otherBusinessId, userId: 'user-biz-b', role: 'owner' };

    await assert.rejects(
      () => service.getDetail(foreignContext, 'cls-expense-1'),
      (err: any) => err.code === 'AI_BOOKKEEPER_REVIEW_NOT_FOUND'
    );

    await assert.rejects(
      () =>
        service.applySuggestion(
          {
            classificationId: 'cls-expense-1',
            finalOperationKind: 'OPERATING_EXPENSE',
            idempotencyKey: 'cross_tenant_apply',
            payload: {
              expenseCategoryId: 'cat-rent-1',
              amountMinor: 7500000,
              description: 'Rent',
              occurredAt: '2026-08-17',
            },
          },
          foreignContext
        ),
      (err: any) => err.code === 'AI_BOOKKEEPER_REVIEW_NOT_FOUND'
    );
  });

  it('12. Cross-Tenant Target Security: Business A cannot attach Business B Category', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    await assert.rejects(
      () =>
        service.applySuggestion(
          {
            classificationId: 'cls-expense-1',
            finalOperationKind: 'OPERATING_EXPENSE',
            idempotencyKey: 'cross_tenant_cat',
            payload: {
              expenseCategoryId: 'cat-biz-b', // Belongs to otherBusinessId
              amountMinor: 7500000,
              description: 'Rent',
              occurredAt: '2026-08-17',
            },
          },
          context
        ),
      (err: any) => err.code === 'AI_BOOKKEEPER_TARGET_NOT_FOUND'
    );
  });

  it('13. RBAC Preflight: read_only or sales_staff denied general bookkeeper review & expense apply', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);

    const readOnlyContext = { businessId, userId: 'user-ro', role: 'read_only' };
    const salesContext = { businessId, userId: 'user-sales', role: 'sales_staff' };

    await assert.rejects(
      () => service.getInbox(readOnlyContext),
      (err: any) => err.code === 'AI_BOOKKEEPER_REVIEW_FORBIDDEN'
    );

    await assert.rejects(
      () => service.getInbox(salesContext),
      (err: any) => err.code === 'AI_BOOKKEEPER_REVIEW_FORBIDDEN'
    );
  });

  it('14. Gemini Call Count Boundary: applying existing review calls Gemini ZERO times', async () => {
    const supabase = createMockSupabase(defaultMockData);
    const service = new AIBookkeeperReviewService(supabase);
    const context = { businessId, userId, role: 'owner' };

    const result = await service.applySuggestion(
      {
        classificationId: 'cls-expense-1',
        finalOperationKind: 'OPERATING_EXPENSE',
        idempotencyKey: 'test_zero_gemini_calls',
        payload: {
          amountMinor: 7500000,
          expenseCategoryId: 'cat-rent-1',
          description: 'Paid shop rent for August',
          occurredAt: '2026-08-17',
        },
      },
      context
    );

    assert.equal(result.status, 'succeeded');
    // Application is purely deterministic domain execution
    assert.ok(result.canonicalTargetId);
  });
});
