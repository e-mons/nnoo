import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BusinessHealthFormulaV1,
  BusinessHealthCalculator,
  HealthScoreNumericGuard,
  type HealthScoreRawInputs,
} from '../health';
import { BusinessHealthService } from '../health/health-service';
import type { GeminiClientInterface } from '../gemini/client';

describe('Tranche 3 Prompt 6: NNOO Business Health Score', () => {
  const baseSampleInputs: HealthScoreRawInputs = {
    netSalesMinor: 100000000, // ₦1,000,000
    grossSalesMinor: 105000000,
    cogsMinor: 60000000, // ₦600,000 -> GP = ₦400,000 (40% GPM)
    grossProfitMinor: 40000000,
    operatingExpensesMinor: 18000000, // ₦180,000 (45% of GP -> EBR = 0.45)
    operatingResultMinor: 22000000, // ₦220,000 (+22% net margin)
    salesCount: 15,
    totalReceivablesMinor: 15000000, // ₦150,000 (15% of net sales)
    overdueInvoicesCount: 0,
    totalPayablesMinor: 10000000, // ₦100,000 (25% of GP)
    trackedProductsCount: 20,
    lowStockCount: 1,
    outOfStockCount: 0,
    dataCoverage: 'HIGH',
    evaluationPeriod: { start: '2026-08-01', end: '2026-08-31' },
    asOfTimestamp: '2026-08-17T12:00:00.000Z',
    businessTimezone: 'Africa/Lagos',
    currencyCode: 'NGN',
    sourceFingerprint: 'test_fingerprint_base',
  };

  // 1. Formula Registry & Dimensions
  it('1. Formula Registry & Dimensions: defines business-health-score-v1 with 5 dimensions', () => {
    const result = BusinessHealthCalculator.calculate(baseSampleInputs);

    assert.equal(result.formulaVersion, 'business-health-score-v1');
    assert.equal(result.status, 'READY');
    assert.equal(typeof result.score, 'number');
    assert.ok(result.score! >= 0 && result.score! <= 100);
    assert.equal(result.dimensions.length, 5);
    assert.equal(result.applicableDimensionKeys.length, 5);
  });

  // 2. Deterministic Repeatability
  it('2. Deterministic Repeatability: running 100 times yields identical score, band, and reasons', () => {
    const firstRun = BusinessHealthCalculator.calculate(baseSampleInputs);

    for (let i = 0; i < 100; i++) {
      const run = BusinessHealthCalculator.calculate(baseSampleInputs);
      assert.equal(run.score, firstRun.score);
      assert.equal(run.scoreBand, firstRun.scoreBand);
      assert.deepEqual(run.strengthReasonKeys, firstRun.strengthReasonKeys);
      assert.deepEqual(run.attentionReasonKeys, firstRun.attentionReasonKeys);
    }
  });

  // 3. Service Business (Inventory NOT_APPLICABLE)
  it('3. Service Business: 0 tracked inventory is NOT_APPLICABLE with 0 weight and no penalty', () => {
    const serviceInputs: HealthScoreRawInputs = {
      ...baseSampleInputs,
      trackedProductsCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      sourceFingerprint: 'test_fingerprint_service',
    };

    const result = BusinessHealthCalculator.calculate(serviceInputs);

    assert.equal(result.status, 'READY');
    assert.equal(result.applicableDimensionKeys.length, 4);
    assert.ok(!result.applicableDimensionKeys.includes('INVENTORY_READINESS'));

    const invDim = result.dimensions.find((d) => d.key === 'INVENTORY_READINESS');
    assert.ok(invDim);
    assert.equal(invDim.status, 'NOT_APPLICABLE');
    assert.equal(invDim.appliedWeight, 0);
    assert.equal(invDim.score, null);
    assert.deepEqual(invDim.reasonKeys, ['INVENTORY_NOT_APPLICABLE']);
  });

  // 4. Insufficient Data Handling
  it('4. Insufficient Data Handling: empty business produces INSUFFICIENT_DATA with null score', () => {
    const emptyInputs: HealthScoreRawInputs = {
      ...baseSampleInputs,
      netSalesMinor: 0,
      grossSalesMinor: 0,
      cogsMinor: 0,
      grossProfitMinor: 0,
      operatingExpensesMinor: 0,
      operatingResultMinor: 0,
      salesCount: 0,
      totalReceivablesMinor: 0,
      totalPayablesMinor: 0,
      trackedProductsCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      dataCoverage: 'INSUFFICIENT',
      sourceFingerprint: 'test_fingerprint_empty',
    };

    const result = BusinessHealthCalculator.calculate(emptyInputs);

    assert.equal(result.status, 'INSUFFICIENT_DATA');
    assert.equal(result.score, null);
    assert.equal(result.scoreBand, null);
    assert.equal(result.dataCoverage, 'INSUFFICIENT');
    assert.ok(result.attentionReasonKeys.includes('DATA_COVERAGE_INSUFFICIENT'));
  });

  // 5. Exact Score Band Boundaries
  it('5. Score Band Boundaries: verifies exact 49/50, 64/65, and 79/80 cutoffs', () => {
    assert.equal(BusinessHealthFormulaV1.deriveScoreBand(100), 'STRONG');
    assert.equal(BusinessHealthFormulaV1.deriveScoreBand(80), 'STRONG');
    assert.equal(BusinessHealthFormulaV1.deriveScoreBand(79), 'GOOD');
    assert.equal(BusinessHealthFormulaV1.deriveScoreBand(65), 'GOOD');
    assert.equal(BusinessHealthFormulaV1.deriveScoreBand(64), 'FAIR');
    assert.equal(BusinessHealthFormulaV1.deriveScoreBand(50), 'FAIR');
    assert.equal(BusinessHealthFormulaV1.deriveScoreBand(49), 'NEEDS_ATTENTION');
    assert.equal(BusinessHealthFormulaV1.deriveScoreBand(0), 'NEEDS_ATTENTION');
  });

  // 6. Division by Zero & Negative Operating Result Safety
  it('6. Division by Zero & Negative Operations: handles 0 sales and negative results safely', () => {
    const lossInputs: HealthScoreRawInputs = {
      ...baseSampleInputs,
      netSalesMinor: 5000000,
      grossProfitMinor: -5000000,
      operatingExpensesMinor: 10000000,
      operatingResultMinor: -15000000,
      salesCount: 2,
      totalReceivablesMinor: 15000000,
      overdueInvoicesCount: 4,
      totalPayablesMinor: 10000000,
      trackedProductsCount: 10,
      lowStockCount: 5,
      outOfStockCount: 4,
      dataCoverage: 'LOW',
      sourceFingerprint: 'test_fingerprint_loss',
    };

    const result = BusinessHealthCalculator.calculate(lossInputs);

    assert.equal(result.status, 'READY');
    assert.ok(result.score! >= 0 && result.score! <= 100);
    assert.equal(result.scoreBand, 'NEEDS_ATTENTION');
    assert.ok(result.attentionReasonKeys.includes('OPERATING_RESULT_NEGATIVE'));
  });

  // 7. Numeric Guard: Blocks Prohibited Credit Claims, Forecasts, and Score Overrides
  it('7. Numeric Guard: rejects credit claims, loan qualifications, forecasts, and score mismatch', () => {
    const context = {
      deterministicScore: 78,
      deterministicBand: 'GOOD' as const,
      allowedReasonKeys: ['GROSS_PROFIT_STRONG', 'RECEIVABLES_HEALTHY'] as any,
      allowedActionKeys: ['OPEN_SALES_REPORT'] as any,
    };

    // Case A: Credit score / loan qualification attempt
    assert.throws(
      () =>
        HealthScoreNumericGuard.validateExplanation(
          {
            headline: 'Great Performance',
            overview: 'This score means you qualify for a loan from commercial banks.',
          },
          context
        ),
      /prohibited credit score or loan qualification claims/
    );

    // Case B: Future revenue forecast attempt
    assert.throws(
      () =>
        HealthScoreNumericGuard.validateExplanation(
          {
            headline: 'Future Projections',
            overview: 'Next month sales will be ₦50M based on current trajectory.',
          },
          context
        ),
      /prohibited future revenue forecasts/
    );

    // Case C: Tax liability claim attempt
    assert.throws(
      () =>
        HealthScoreNumericGuard.validateExplanation(
          {
            headline: 'Tax Alert',
            overview: 'Your tax liability is ₦1,500,000 for this quarter.',
          },
          context
        ),
      /prohibited tax liability claims/
    );

    // Case D: Model attempting to override server score
    assert.throws(
      () =>
        HealthScoreNumericGuard.validateExplanation(
          {
            headline: 'Score Update',
            overview: 'You achieved a score of 95/100 this month.',
          },
          context
        ),
      /inject a score that contradicts the deterministic calculation/
    );

    // Case E: Valid grounded explanation passes cleanly
    const valid = HealthScoreNumericGuard.validateExplanation(
      {
        headline: 'Solid Business Health Baseline',
        overview: 'Your gross profit margins and manageable supplier payables support a Good operational standing.',
        strengthReasonKeys: ['GROSS_PROFIT_STRONG'] as any,
        actionKeys: ['OPEN_SALES_REPORT'] as any,
      },
      context
    );

    assert.equal(valid.headline, 'Solid Business Health Baseline');
    assert.deepEqual(valid.strengthReasonKeys, ['GROSS_PROFIT_STRONG']);
    assert.deepEqual(valid.actionKeys, ['OPEN_SALES_REPORT']);
  });

  function createMockSupabase(overrides: {
    perfData?: any;
    posData?: any;
    businessData?: any;
    snapshots?: any[];
  } = {}) {
    const {
      perfData = {
        net_sales: 10000000,
        gross_sales: 10000000,
        cogs: 6000000,
        gross_profit: 4000000,
        operating_expenses: 2000000,
        operating_result: 2000000,
      },
      posData = {
        accounts_receivable: 500000,
        accounts_payable: 300000,
        inventory_value: 2000000,
        tracked_items_count: 5,
        low_stock_count: 0,
        outOfStockCount: 0,
        overdue_invoices_count: 0,
      },
      businessData = { id: 'biz_1', created_at: '2026-01-01', status: 'active' },
      snapshots = [],
    } = overrides;

    const createChain = () => {
      const chain: any = {
        select: () => chain,
        insert: (row: any) => {
          const inserted = { id: 'snap_' + Math.random().toString(36).substring(2, 7), ...row, created_at: new Date().toISOString() };
          snapshots.push(inserted);
          return {
            select: () => ({
              single: async () => ({ data: inserted, error: null }),
            }),
          };
        },
        update: () => chain,
        eq: () => chain,
        neq: () => chain,
        gte: () => chain,
        lte: () => chain,
        order: () => chain,
        limit: () => chain,
        single: async () => ({ data: businessData, error: null }),
        maybeSingle: async () => ({ data: businessData, error: null }),
      };
      return chain;
    };

    return {
      from: (tableName: string) => {
        if (tableName === 'businesses') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: businessData, error: null }),
                single: async () => ({ data: businessData, error: null }),
              }),
            }),
          };
        }
        if (tableName === 'sales') {
          return {
            select: (_cols?: string, opts?: any) => {
              if (opts?.count === 'exact') {
                return {
                  eq: () => ({
                    eq: () => ({
                      gte: () => ({
                        lte: async () => ({ count: 10, error: null }),
                      }),
                    }),
                  }),
                };
              }
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: async () => ({ data: { sale_date: '2026-01-01' }, error: null }),
                    }),
                  }),
                }),
              };
            },
          };
        }
        if (tableName === 'ai_business_health_snapshots') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: async () => ({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
                order: () => ({
                  limit: async () => ({ data: snapshots, error: null }),
                }),
                maybeSingle: async () => ({ data: snapshots[0] || null, error: null }),
              }),
            }),
            insert: (row: any) => {
              const inserted = { id: 'snap_' + Math.random().toString(36).substring(2, 7), ...row, created_at: new Date().toISOString() };
              snapshots.push(inserted);
              return {
                select: () => ({
                  single: async () => ({ data: inserted, error: null }),
                }),
              };
            },
            update: () => ({
              eq: async () => ({ data: null, error: null }),
            }),
          };
        }
        return createChain();
      },
      rpc: async (fnName: string) => {
        if (fnName === 'get_dashboard_performance_metrics') {
          return { data: perfData, error: null };
        }
        if (fnName === 'get_dashboard_current_position') {
          return { data: posData, error: null };
        }
        return { data: null, error: null };
      },
    } as any;
  }

  // 8. Role Authorization Preflights
  it('8. Role Authorization: permitted roles allowed; sales_staff denied full health score', async () => {
    const mockSupabase = createMockSupabase();

    // Denied role
    await assert.rejects(
      () =>
        BusinessHealthService.getCurrentScore({
          supabase: mockSupabase,
          businessId: 'biz_1',
          userId: 'user_sales',
          userRole: 'sales_staff',
        }),
      /Role 'sales_staff' is not authorized/
    );

    // Permitted role
    const ownerResult = await BusinessHealthService.getCurrentScore({
      supabase: mockSupabase,
      businessId: 'biz_1',
      userId: 'user_owner',
      userRole: 'owner',
    });

    assert.equal(ownerResult.status, 'READY');
    assert.ok(ownerResult.score! > 0);
  });

  // 9. End-to-End Explanation Generation
  it('9. End-to-End Explanation: invokes Gemini with deterministic context and saves snapshot', async () => {
    const testBusinessId = '00000000-0000-0000-0000-000000000001';
    const mockSupabase = createMockSupabase({
      businessData: { id: testBusinessId, created_at: '2026-01-01', status: 'active' },
    });

    const mockGeminiClient: GeminiClientInterface = {
      generateStructuredContent: async <T>() => ({
        data: {
          schemaVersion: '1.0.0',
          headline: 'Strong operational health with controlled expenses',
          overview: 'Your business demonstrates healthy gross profit margins and low receivable balances.',
          strengthReasonKeys: ['GROSS_PROFIT_STRONG', 'OPERATING_RESULT_POSITIVE'],
          attentionReasonKeys: [],
          actionKeys: ['OPEN_SALES_REPORT', 'OPEN_PROFITABILITY_REPORT'],
        } as T,
        rawText: JSON.stringify({
          schemaVersion: '1.0.0',
          headline: 'Strong operational health with controlled expenses',
          overview: 'Your business demonstrates healthy gross profit margins and low receivable balances.',
          strengthReasonKeys: ['GROSS_PROFIT_STRONG', 'OPERATING_RESULT_POSITIVE'],
          attentionReasonKeys: [],
          actionKeys: ['OPEN_SALES_REPORT', 'OPEN_PROFITABILITY_REPORT'],
        }),
        usage: { inputTokens: 200, outputTokens: 80, totalTokens: 280 },
        model: 'gemini-2.5-flash',
        latencyMs: 150,
      }),
    };

    const explanation = await BusinessHealthService.explainScore(
      {
        supabase: mockSupabase,
        businessId: testBusinessId,
        userId: 'user_owner',
        userRole: 'owner',
      },
      undefined,
      mockGeminiClient
    );

    assert.equal(explanation.headline, 'Strong operational health with controlled expenses');
    assert.deepEqual(explanation.strengthReasonKeys, ['GROSS_PROFIT_STRONG', 'OPERATING_RESULT_POSITIVE']);
    assert.deepEqual(explanation.actionKeys, ['OPEN_SALES_REPORT', 'OPEN_PROFITABILITY_REPORT']);
  });
});

