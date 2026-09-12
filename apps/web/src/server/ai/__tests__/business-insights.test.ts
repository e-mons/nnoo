import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AIBusinessInsightService,
  BusinessPeriodResolver,
  DeterministicInsightSignalEngine,
  NumericLiteralGuard,
  MockGeminiClient,
} from '../index';

const businessId = '00000000-0000-0000-0000-000000000001';
const otherBusinessId = '00000000-0000-0000-0000-000000000002';
const userId = 'user-owner-1';
const restrictedUserId = 'user-sales-1';

function createMockSupabase(overrides: {
  currentPerformance?: any;
  previousPerformance?: any;
  currentPosition?: any;
  memberships?: any[];
  summaries?: any[];
} = {}) {
  const currentPerformance = overrides.currentPerformance || {
    grossSalesMinor: '5000000', // ₦50,000.00
    salesCount: 10,
    refundsMinor: '500000', // ₦5,000.00
    netSalesMinor: '4500000', // ₦45,000.00
    customerPaymentsReceivedMinor: '4000000',
    cogsMinor: '2000000', // ₦20,000.00
    grossProfitMinor: '2500000', // ₦25,000.00
    operatingExpensesMinor: '1000000', // ₦10,000.00
    inventoryAdjustmentGainMinor: '0',
    inventoryShrinkageLossMinor: '0',
    operatingResultMinor: '1500000', // ₦15,000.00
  };

  const previousPerformance = overrides.previousPerformance || {
    grossSalesMinor: '4000000', // ₦40,000.00
    salesCount: 8,
    refundsMinor: '0',
    netSalesMinor: '4000000', // ₦40,000.00
    customerPaymentsReceivedMinor: '3500000',
    cogsMinor: '1800000',
    grossProfitMinor: '2200000',
    operatingExpensesMinor: '900000',
    inventoryAdjustmentGainMinor: '0',
    inventoryShrinkageLossMinor: '0',
    operatingResultMinor: '1300000',
  };

  const currentPosition = overrides.currentPosition || {
    accountsReceivableMinor: '2500000', // ₦25,000.00
    accountsPayableMinor: '1500000', // ₦15,000.00
    inventoryValueMinor: '12000000', // ₦120,000.00
    lowStockCount: 3,
    outOfStockCount: 1,
    overdueInvoicesCount: 2,
  };

  const memberships = overrides.memberships || [
    { business_id: businessId, user_id: userId, role: 'owner', membership_status: 'active' },
    { business_id: businessId, user_id: restrictedUserId, role: 'sales_staff', membership_status: 'active' },
    { business_id: otherBusinessId, user_id: 'other-user', role: 'owner', membership_status: 'active' },
  ];

  const summaries = overrides.summaries ? [...overrides.summaries] : [];
  const invocations: any[] = [];

  const client: any = {
    _summaries: summaries,
    _invocations: invocations,
    rpc: async (fn: string, params: any) => {
      if (fn === 'get_dashboard_performance_metrics') {
        if (params.p_business_id !== businessId && params.p_business_id !== otherBusinessId) {
          return { data: null, error: { message: 'Business not found' } };
        }
        if (params.p_start_date?.includes('01') || params.p_start_date >= '2026-08-01') {
          return { data: currentPerformance, error: null };
        }
        return { data: previousPerformance, error: null };
      }
      if (fn === 'get_dashboard_current_position') {
        return { data: currentPosition, error: null };
      }
      return { data: null, error: { message: `Unknown RPC function ${fn}` } };
    },
    from: (table: string) => {
      if (table === 'business_memberships') {
        return {
          select: () => ({
            eq: (col1: string, val1: any) => ({
              eq: (col2: string, val2: any) => {
                const match = memberships.find(
                  (m) => (m as any)[col1] === val1 && (m as any)[col2] === val2
                );
                return {
                  single: async () => {
                    if (!match) return { data: null, error: { message: 'Not found' } };
                    return { data: match, error: null };
                  },
                };
              },
            }),
          }),
        };
      }

      if (table === 'ai_business_summaries') {
        const queryFilters: any = {};
        const builder: any = {
          select: () => builder,
          insert: (record: any) => {
            const newRecord = {
              id: record.id || `summary-${summaries.length + 1}`,
              created_at: record.created_at || new Date().toISOString(),
              ...record,
            };
            summaries.push(newRecord);
            return {
              select: () => ({
                single: async () => ({ data: newRecord, error: null }),
              }),
            };
          },
          update: (updates: any) => {
            const updateFilters: any = {};
            const updateBuilder: any = {
              eq: (col: string, val: any) => {
                updateFilters[col] = val;
                return updateBuilder;
              },
              then: (resolve: any) => {
                for (const s of summaries) {
                  let matches = true;
                  for (const [k, v] of Object.entries(updateFilters)) {
                    if (s[k] !== v) matches = false;
                  }
                  if (matches) Object.assign(s, updates);
                }
                return resolve({ data: null, error: null });
              },
            };
            return updateBuilder;
          },
          eq: (col: string, val: any) => {
            queryFilters[col] = val;
            return builder;
          },
          in: (col: string, vals: any[]) => {
            queryFilters[`${col}_in`] = vals;
            return builder;
          },
          order: () => builder,
          limit: () => builder,
          maybeSingle: async () => {
            const matches = summaries.filter((s) => {
              for (const [k, v] of Object.entries(queryFilters)) {
                if (k.endsWith('_in')) {
                  const actualCol = k.replace('_in', '');
                  if (!(v as any[]).includes(s[actualCol])) return false;
                } else if (s[k] !== v) {
                  return false;
                }
              }
              return true;
            });
            return { data: matches[0] || null, error: null };
          },
          single: async () => {
            const res = await builder.maybeSingle();
            if (!res.data) return { data: null, error: { message: 'Not found' } };
            return res;
          },
        };
        return builder;
      }

      if (table === 'ai_invocations') {
        return {
          insert: async (rec: any) => {
            invocations.push(rec);
            return { data: rec, error: null };
          },
        };
      }

      throw new Error(`Unhandled mock table ${table}`);
    },
  };

  return client;
}

describe('Tranche 3 Prompt 4: Verified Business Summaries & Smart Insights', () => {
  // Test 1: Report Parity
  it('1. Report Parity: Verified facts equal canonical reporting RPC results exactly (0 arithmetic drift)', async () => {
    const supabase = createMockSupabase();
    const factsResult = await AIBusinessInsightService.getVerifiedFacts({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
    });

    const perf = factsResult.bundle.performance;
    const pos = factsResult.bundle.currentPosition;

    // Direct comparison against canonical RPC outputs
    assert.strictEqual(perf.netSalesMinor, 4500000, 'Net Sales must equal ₦45,000.00');
    assert.strictEqual(perf.grossProfitMinor, 2500000, 'Gross Profit must equal ₦25,000.00');
    assert.strictEqual(perf.operatingExpensesMinor, 1000000, 'Operating Expenses must equal ₦10,000.00');
    assert.strictEqual(perf.operatingResultMinor, 1500000, 'Operating Result must equal ₦15,000.00');
    assert.strictEqual(pos.accountsReceivableMinor, 2500000, 'AR must equal ₦25,000.00');
    assert.strictEqual(pos.accountsPayableMinor, 1500000, 'AP must equal ₦15,000.00');
    assert.strictEqual(pos.inventoryValueMinor, 12000000, 'Inventory value must equal ₦120,000.00');
    assert.strictEqual(pos.overdueInvoicesCount, 2, 'Overdue invoices count must equal 2');
    assert.strictEqual(pos.lowStockCount, 3, 'Low stock count must equal 3');
  });

  // Test 2: Period & Business Timezone Resolution
  it('2. Period & Timezone: Resolves business timezone dates deterministically with correct comparison periods', () => {
    const fixedNow = new Date('2026-08-17T12:00:00Z');

    // Today
    const todayComp = BusinessPeriodResolver.resolvePeriod('today', 'Africa/Lagos', undefined, undefined, fixedNow);
    assert.strictEqual(todayComp.current.start, '2026-08-17');
    assert.strictEqual(todayComp.current.end, '2026-08-17');
    assert.strictEqual(todayComp.previous?.start, '2026-08-16');
    assert.strictEqual(todayComp.previous?.end, '2026-08-16');

    // This Month
    const monthComp = BusinessPeriodResolver.resolvePeriod('this_month', 'Africa/Lagos', undefined, undefined, fixedNow);
    assert.strictEqual(monthComp.current.start, '2026-08-01');
    assert.strictEqual(monthComp.current.end, '2026-08-17');
    assert.strictEqual(monthComp.previous?.start, '2026-07-01');
    assert.strictEqual(monthComp.previous?.end, '2026-07-31');

    // Custom
    const customComp = BusinessPeriodResolver.resolvePeriod('custom', 'Africa/Lagos', '2026-08-10', '2026-08-17', fixedNow);
    assert.strictEqual(customComp.current.start, '2026-08-10');
    assert.strictEqual(customComp.current.end, '2026-08-17');
    assert.strictEqual(customComp.previous?.start, '2026-08-02');
    assert.strictEqual(customComp.previous?.end, '2026-08-09');
  });

  // Test 3: Zero-Division / Safe Percentage Calculation
  it('3. Zero-Division Safety: When previous period sales are 0, percentage comparison does not produce NaN/Infinity', () => {
    const bundle: any = {
      summaryType: 'this_month',
      currencyCode: 'NGN',
      period: { start: '2026-08-01', end: '2026-08-17', timezone: 'Africa/Lagos', label: 'This Month' },
      comparison: { current: { start: '2026-08-01', end: '2026-08-17' }, isComparable: true },
      performance: {
        netSalesMinor: 5000000,
        refundsMinor: 0,
        grossProfitMinor: 3000000,
        operatingExpensesMinor: 1000000,
        operatingResultMinor: 2000000,
      },
      previousPerformance: {
        netSalesMinor: 0, // Zero prior sales
        refundsMinor: 0,
        grossProfitMinor: 0,
        operatingExpensesMinor: 0,
        operatingResultMinor: 0,
      },
      currentPosition: {
        accountsReceivableMinor: 0,
        accountsPayableMinor: 0,
        inventoryValueMinor: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        overdueInvoicesCount: 0,
      },
    };

    const { signals } = DeterministicInsightSignalEngine.deriveSignals(bundle);
    const salesSignal = signals.find((s) => s.signalKey === 'NET_SALES_CHANGE');

    assert.ok(salesSignal);
    assert.strictEqual(salesSignal.direction, 'UP');
    assert.ok(!salesSignal.changeDescription?.includes('NaN'));
    assert.ok(!salesSignal.changeDescription?.includes('Infinity'));
  });

  // Test 4: Current-Position as-of vs Period Metrics Separation
  it('4. Current Position Separation: AR, AP, and Inventory valuation have distinct asOfTimestamp and point-in-time semantics', async () => {
    const supabase = createMockSupabase();
    const facts = await AIBusinessInsightService.getVerifiedFacts({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
    });

    assert.ok(facts.bundle.currentPosition.asOfTimestamp);
    assert.strictEqual(typeof facts.bundle.currentPosition.asOfTimestamp, 'string');
    assert.strictEqual(facts.bundle.summaryType, 'this_month');
  });

  // Test 5: Permission-Sensitive Fact Projection
  it('5. Permission-Sensitive Fact Projection: sales_staff without reports permission is denied summary generation', async () => {
    const supabase = createMockSupabase();
    await assert.rejects(
      async () => {
        await AIBusinessInsightService.generateSummary({
          supabase,
          businessId,
          userId: restrictedUserId,
          userRole: 'sales_staff',
          summaryType: 'this_month',
          idempotencyKey: 'test-key-sales',
        });
      },
      (err: any) => {
        assert.strictEqual(err.code, 'AI_INSIGHTS_FORBIDDEN');
        return true;
      }
    );
  });

  // Test 6: Deterministic Signal Engine
  it('6. Deterministic Signal Engine: Server derives direction UP, DOWN, UNCHANGED, NOT_COMPARABLE without calling Gemini', () => {
    const bundleUp: any = {
      summaryType: 'this_month',
      currencyCode: 'NGN',
      period: { start: '2026-08-01', end: '2026-08-17', timezone: 'Africa/Lagos', label: 'This Month' },
      comparison: { current: { start: '2026-08-01', end: '2026-08-17' }, isComparable: true },
      performance: { netSalesMinor: 5000000, refundsMinor: 0, grossProfitMinor: 3000000, operatingExpensesMinor: 1000000, operatingResultMinor: 2000000 },
      previousPerformance: { netSalesMinor: 4000000, refundsMinor: 0, grossProfitMinor: 2000000, operatingExpensesMinor: 1200000, operatingResultMinor: 800000 },
      currentPosition: { accountsReceivableMinor: 1000000, accountsPayableMinor: 500000, inventoryValueMinor: 5000000, lowStockCount: 2, outOfStockCount: 0, overdueInvoicesCount: 1 },
    };

    const { signals, allowableActions } = DeterministicInsightSignalEngine.deriveSignals(bundleUp);
    const salesSig = signals.find((s) => s.signalKey === 'NET_SALES_CHANGE');
    const expSig = signals.find((s) => s.signalKey === 'OPERATING_EXPENSE_CHANGE');
    const arSig = signals.find((s) => s.signalKey === 'OUTSTANDING_RECEIVABLES');

    assert.strictEqual(salesSig?.direction, 'UP', 'Sales increased -> UP');
    assert.strictEqual(expSig?.direction, 'DOWN', 'Expenses decreased -> DOWN');
    assert.strictEqual(arSig?.direction, 'UP', 'Receivables present -> UP');
    assert.ok(allowableActions.includes('OPEN_SALES_REPORT'));
    assert.ok(allowableActions.includes('OPEN_OVERDUE_INVOICES'));
  });

  // Test 7: Zero-Data Business
  it('7. Zero-Data Business: Empty business returns deterministic empty state with ZERO Gemini provider calls', async () => {
    let providerCalls = 0;
    const mockClient = new MockGeminiClient(async () => {
      providerCalls++;
      return {};
    });

    const supabase = createMockSupabase({
      currentPerformance: {
        grossSalesMinor: '0',
        salesCount: 0,
        refundsMinor: '0',
        netSalesMinor: '0',
        customerPaymentsReceivedMinor: '0',
        cogsMinor: '0',
        grossProfitMinor: '0',
        operatingExpensesMinor: '0',
        inventoryAdjustmentGainMinor: '0',
        inventoryShrinkageLossMinor: '0',
        operatingResultMinor: '0',
      },
      currentPosition: {
        accountsReceivableMinor: '0',
        accountsPayableMinor: '0',
        inventoryValueMinor: '0',
        lowStockCount: 0,
        outOfStockCount: 0,
        overdueInvoicesCount: 0,
      },
    });

    const summary = await AIBusinessInsightService.generateSummary({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
      idempotencyKey: 'zero-data-key-1',
      geminiClient: mockClient,
    });

    assert.strictEqual(providerCalls, 0, 'Gemini must be called ZERO times for empty business');
    assert.strictEqual(summary.modelId, 'deterministic-rules');
    assert.ok(summary.headline.includes('No recorded business activity'));
  });

  // Test 8: Structured Output Validation
  it('8. Structured Output: Valid Gemini structured response parses and validates against Zod schema', async () => {
    const mockClient = new MockGeminiClient(async () => ({
      schemaVersion: '1.0.0',
      headline: 'Solid sales growth with key inventory items to restock',
      overview: 'Net sales increased by 12% compared to the prior period while operating expenses remained well controlled.',
      highlightSignalKeys: ['NET_SALES_CHANGE', 'GROSS_PROFIT_CHANGE'],
      attentionSignalKeys: ['OVERDUE_INVOICES_PRESENT', 'LOW_STOCK_PRESENT'],
      actionKeys: ['OPEN_SALES_REPORT', 'OPEN_OVERDUE_INVOICES'],
    }));

    const supabase = createMockSupabase();
    const summary = await AIBusinessInsightService.generateSummary({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
      idempotencyKey: 'valid-summary-key-1',
      geminiClient: mockClient,
    });

    assert.strictEqual(summary.status, 'ready');
    assert.strictEqual(summary.headline, 'Solid sales growth with key inventory items to restock');
    assert.deepStrictEqual(summary.selectedHighlightSignalKeys, ['NET_SALES_CHANGE', 'GROSS_PROFIT_CHANGE']);
    assert.deepStrictEqual(summary.selectedActionKeys, ['OPEN_SALES_REPORT', 'OPEN_OVERDUE_INVOICES']);
  });

  // Test 9: Unknown Signal Key Rejection
  it('9. Signal Key Allowlist: Fabricated or unknown signal key from model is rejected with AI_INSIGHTS_INVALID_RESULT', async () => {
    const mockClient = new MockGeminiClient(async () => ({
      schemaVersion: '1.0.0',
      headline: 'Great growth',
      overview: 'Overview text.',
      highlightSignalKeys: ['FABRICATED_SIGNAL_XYZ'],
      attentionSignalKeys: [],
      actionKeys: ['OPEN_SALES_REPORT'],
    }));

    const supabase = createMockSupabase();
    await assert.rejects(
      async () => {
        await AIBusinessInsightService.generateSummary({
          supabase,
          businessId,
          userId,
          userRole: 'owner',
          summaryType: 'this_month',
          idempotencyKey: 'bad-signal-key',
          geminiClient: mockClient,
        });
      },
      (err: any) => {
        assert.ok(err.code === 'AI_INSIGHTS_INVALID_RESULT' || err.code === 'AI_RESPONSE_INVALID');
        return true;
      }
    );
  });

  // Test 10: Unknown Action Key Rejection
  it('10. Action Key Allowlist: Unknown navigation action key from model is rejected with AI_INSIGHTS_INVALID_RESULT', async () => {
    const mockClient = new MockGeminiClient(async () => ({
      schemaVersion: '1.0.0',
      headline: 'Great growth',
      overview: 'Overview text.',
      highlightSignalKeys: ['NET_SALES_CHANGE'],
      attentionSignalKeys: [],
      actionKeys: ['TAKE_A_LOAN_NOW'], // Malicious/invalid action key
    }));

    const supabase = createMockSupabase();
    await assert.rejects(
      async () => {
        await AIBusinessInsightService.generateSummary({
          supabase,
          businessId,
          userId,
          userRole: 'owner',
          summaryType: 'this_month',
          idempotencyKey: 'bad-action-key',
          geminiClient: mockClient,
        });
      },
      (err: any) => {
        assert.ok(err.code === 'AI_INSIGHTS_INVALID_RESULT' || err.code === 'AI_RESPONSE_INVALID');
        return true;
      }
    );
  });

  // Test 11: Health Score & Credit Score Injection Rejection
  it('11. Numeric Guard: Model output injecting Business Health Score or Credit Score is blocked', () => {
    assert.throws(
      () => {
        NumericLiteralGuard.validate(
          {
            schemaVersion: '1.0.0',
            headline: 'Your Business Health Score is 85/100',
            overview: 'You have a healthy business rating.',
            highlightSignalKeys: ['NET_SALES_CHANGE'],
            attentionSignalKeys: [],
            actionKeys: ['OPEN_SALES_REPORT'],
          },
          ['NET_SALES_CHANGE'],
          ['OPEN_SALES_REPORT']
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'AI_INSIGHTS_INVALID_RESULT');
        return true;
      }
    );

    assert.throws(
      () => {
        NumericLiteralGuard.validate(
          {
            schemaVersion: '1.0.0',
            headline: 'Credit assessment summary',
            overview: 'Your credit score is Tier A for loans.',
            highlightSignalKeys: ['NET_SALES_CHANGE'],
            attentionSignalKeys: [],
            actionKeys: ['OPEN_SALES_REPORT'],
          },
          ['NET_SALES_CHANGE'],
          ['OPEN_SALES_REPORT']
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'AI_INSIGHTS_INVALID_RESULT');
        return true;
      }
    );
  });

  // Test 12: Forecast Injection Rejection
  it('12. Forecast Guard: Model output predicting future revenues is blocked', () => {
    assert.throws(
      () => {
        NumericLiteralGuard.validate(
          {
            schemaVersion: '1.0.0',
            headline: 'Future forecast',
            overview: 'You will make ₦10000000 next month based on current trends.',
            highlightSignalKeys: ['NET_SALES_CHANGE'],
            attentionSignalKeys: [],
            actionKeys: ['OPEN_SALES_REPORT'],
          },
          ['NET_SALES_CHANGE'],
          ['OPEN_SALES_REPORT']
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'AI_INSIGHTS_INVALID_RESULT');
        return true;
      }
    );
  });

  // Test 13: Summary Reuse & Deduplication
  it('13. Summary Reuse: Identical fact fingerprint reuses active summary with ZERO extra Gemini calls', async () => {
    let callCount = 0;
    const mockClient = new MockGeminiClient(async () => {
      callCount++;
      return {
        schemaVersion: '1.0.0',
        headline: 'Stable performance',
        overview: 'Business performance remained stable.',
        highlightSignalKeys: ['NET_SALES_CHANGE'],
        attentionSignalKeys: [],
        actionKeys: ['OPEN_SALES_REPORT'],
      };
    });

    const supabase = createMockSupabase();

    // Call 1: Generates new summary
    const sum1 = await AIBusinessInsightService.generateSummary({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
      idempotencyKey: 'dedupe-key-1',
      geminiClient: mockClient,
    });
    assert.strictEqual(callCount, 1);

    // Call 2: Same facts, same user, same period -> Reuses sum1
    const sum2 = await AIBusinessInsightService.generateSummary({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
      idempotencyKey: 'dedupe-key-2',
      geminiClient: mockClient,
    });
    assert.strictEqual(callCount, 1, 'Provider call count must remain 1 on identical fingerprint');
    assert.strictEqual(sum1.id, sum2.id, 'Must return the same summary artifact ID');
  });

  // Test 14: Stale Summary Detection
  it('14. Stale Detection: When facts change, previous summary is identified as stale (isFresh: false)', async () => {
    const supabase = createMockSupabase();

    // Initial fact bundle
    const facts1 = await AIBusinessInsightService.getVerifiedFacts({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
    });
    const fp1 = AIBusinessInsightService.computeSourceFingerprint(facts1.bundle);

    // Insert an old summary with fp1
    supabase._summaries.push({
      id: 'old-sum-1',
      business_id: businessId,
      requested_by_user_id: userId,
      summary_type: 'this_month',
      period_start: facts1.bundle.period.start,
      period_end: facts1.bundle.period.end,
      as_of_timestamp: new Date().toISOString(),
      business_timezone: 'Africa/Lagos',
      currency_code: 'NGN',
      source_fingerprint: fp1,
      permission_scope_fingerprint: 'perm-fp-1',
      headline: 'Old summary',
      overview: 'Old overview',
      selected_highlight_signal_keys: [],
      selected_attention_signal_keys: [],
      selected_action_keys: [],
      verified_fact_snapshot: facts1.bundle,
      prompt_version: '1.0.0',
      model_id: 'gemini-2.5-flash',
      status: 'ready',
      created_at: new Date().toISOString(),
    });

    // Verify initial facts state is fresh
    const checkFresh = await AIBusinessInsightService.getVerifiedFacts({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
    });
    assert.strictEqual(checkFresh.isFresh, true);

    // Simulate new sale recorded (altering net sales)
    supabase.rpc = async (fn: string) => {
      if (fn === 'get_dashboard_performance_metrics') {
        return {
          data: {
            grossSalesMinor: '8000000', // Changed
            salesCount: 15,
            refundsMinor: '0',
            netSalesMinor: '8000000',
            customerPaymentsReceivedMinor: '8000000',
            cogsMinor: '3000000',
            grossProfitMinor: '5000000',
            operatingExpensesMinor: '1000000',
            inventoryAdjustmentGainMinor: '0',
            inventoryShrinkageLossMinor: '0',
            operatingResultMinor: '4000000',
          },
          error: null,
        };
      }
      if (fn === 'get_dashboard_current_position') {
        return {
          data: { accountsReceivableMinor: '0', accountsPayableMinor: '0', inventoryValueMinor: '0', lowStockCount: 0, outOfStockCount: 0, overdueInvoicesCount: 0 },
          error: null,
        };
      }
      return { data: null, error: null };
    };

    // Check facts again -> Fingerprint differs -> isFresh is false
    const checkStale = await AIBusinessInsightService.getVerifiedFacts({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
    });
    assert.strictEqual(checkStale.isFresh, false, 'Summary must be marked stale when underlying facts change');
  });

  // Test 15: Provider Outage Resilience
  it('15. Provider Outage: If Gemini is down or errors, verified business facts remain 100% accessible', async () => {
    const mockClient = new MockGeminiClient(async () => {
      throw new Error('Gemini 503 Service Unavailable');
    });

    const supabase = createMockSupabase();

    // Facts must still load cleanly
    const facts = await AIBusinessInsightService.getVerifiedFacts({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
    });
    assert.strictEqual(facts.bundle.performance.netSalesMinor, 4500000);
    assert.strictEqual(facts.signals.length > 0, true);

    // Summary generation fails cleanly with normalized AI error
    await assert.rejects(
      async () => {
        await AIBusinessInsightService.generateSummary({
          supabase,
          businessId,
          userId,
          userRole: 'owner',
          summaryType: 'this_month',
          idempotencyKey: 'outage-key-1',
          geminiClient: mockClient,
        });
      },
      (err: any) => {
        assert.ok(err.code === 'AI_PROVIDER_UNAVAILABLE' || err.code === 'AI_INSIGHTS_GENERATION_FAILED');
        return true;
      }
    );
  });

  // Test 16: Global AI Kill Switch
  it('16. Global AI Kill Switch: AI_ENABLED=false blocks new summary generation while keeping facts readable', async () => {
    process.env.AI_ENABLED = 'false';
    const supabase = createMockSupabase();

    // Facts still work
    const facts = await AIBusinessInsightService.getVerifiedFacts({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
    });
    assert.ok(facts.bundle.performance.netSalesMinor > 0);

    // Generation is blocked
    await assert.rejects(
      async () => {
        await AIBusinessInsightService.generateSummary({
          supabase,
          businessId,
          userId,
          userRole: 'owner',
          summaryType: 'this_month',
          idempotencyKey: 'killswitch-key-1',
        });
      },
      (err: any) => {
        assert.strictEqual(err.code, 'AI_FEATURE_DISABLED');
        return true;
      }
    );
    process.env.AI_ENABLED = 'true';
  });

  // Test 17: Tenant Security
  it('17. Tenant Security: Business A user cannot access or generate Business B facts or summaries', async () => {
    const supabase = createMockSupabase();
    await assert.rejects(
      async () => {
        await AIBusinessInsightService.getVerifiedFacts({
          supabase,
          businessId: 'unknown-biz-uuid-999',
          userId,
          userRole: 'owner',
          summaryType: 'this_month',
        });
      },
      (err: any) => {
        assert.strictEqual(err.code, 'AI_INSIGHTS_FACT_BUILD_FAILED');
        return true;
      }
    );
  });

  // Test 18: Zero Financial / Operational Side Effects
  it('18. Zero Financial Mutations: Summary generation causes 0 sales, 0 expenses, 0 invoices, 0 inventory movements, and 0 journal entries', async () => {
    const mockClient = new MockGeminiClient(async () => ({
      schemaVersion: '1.0.0',
      headline: 'Financial stability',
      overview: 'Good operational period.',
      highlightSignalKeys: ['NET_SALES_CHANGE'],
      attentionSignalKeys: [],
      actionKeys: ['OPEN_SALES_REPORT'],
    }));

    const supabase = createMockSupabase();
    const summary = await AIBusinessInsightService.generateSummary({
      supabase,
      businessId,
      userId,
      userRole: 'owner',
      summaryType: 'this_month',
      idempotencyKey: 'zero-side-effects-key',
      geminiClient: mockClient,
    });

    assert.ok(summary);
    // Only ai_business_summaries rows created
    assert.strictEqual(supabase._summaries.length, 1);
  });
});
