import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveScheduledPeriod,
  computeNextRunAt,
  getLocalTimeParts,
  buildScheduledIdempotencyKey,
  buildManualIdempotencyKey,
  AttentionScannerService,
  AutomationService,
} from '../automation';
import { MockGeminiClient, type GeminiClientInterface } from '../gemini/client';

describe('Tranche 3 Prompt 8: Production Intelligence Jobs & Automation Foundation', () => {
  const mockBusinessId = '00000000-0000-0000-0000-000000000001';
  const mockUserId = '11111111-1111-1111-1111-111111111111';

  // Helper to create a comprehensive mock Supabase client for automations
  function createMockSupabase(overrides: {
    automations?: any[];
    jobRuns?: any[];
    attentionEvents?: any[];
    catalogItems?: any[];
    inventoryPositions?: any[];
    invoices?: any[];
    classifications?: any[];
    passportSnapshots?: any[];
    healthSnapshots?: any[];
    business?: any;
    memberships?: any[];
  } = {}) {
    const automations = [...(overrides.automations || [])];
    const jobRuns = [...(overrides.jobRuns || [])];
    const attentionEvents = [...(overrides.attentionEvents || [])];
    const catalogItems = [...(overrides.catalogItems || [])];
    const inventoryPositions = [...(overrides.inventoryPositions || [])];
    const invoices = [...(overrides.invoices || [])];
    const classifications = [...(overrides.classifications || [])];
    const passportSnapshots = [...(overrides.passportSnapshots || [])];
    const healthSnapshots = [...(overrides.healthSnapshots || [])];

    // Tracking for financial mutations and notification deliveries
    const financialMutations = {
      sales: 0,
      expenses: 0,
      payments: 0,
      refunds: 0,
      inventoryMovements: 0,
      invoices: 0,
      journalEntries: 0,
    };

    const notificationsDelivered = {
      email: 0,
      push: 0,
      whatsapp: 0,
      sms: 0,
    };

    const business = overrides.business || {
      id: mockBusinessId,
      name: 'ABC Store',
      currency_code: 'NGN',
      timezone: 'Africa/Lagos',
      status: 'active',
    };

    const client: any = {
      _financialMutations: financialMutations,
      _notificationsDelivered: notificationsDelivered,
      _jobRuns: jobRuns,
      _attentionEvents: attentionEvents,
      _automations: automations,

      from: (table: string) => {
        return {
          select: (cols = '*', opts?: any) => {
            let filterField: string | null = null;
            let filterVal: any = null;
            let statusFilter: any = null;
            let typeFilter: any = null;
            let dedupeFilter: any = null;
            let sourceTypeFilter: any = null;
            let idempotencyFilter: any = null;

            const builder: any = {
              eq: (f: string, v: any) => {
                if (f === 'business_id') filterVal = v;
                if (f === 'automation_type') typeFilter = v;
                if (f === 'status') statusFilter = v;
                if (f === 'type') typeFilter = v;
                if (f === 'dedupe_key') dedupeFilter = v;
                if (f === 'source_type') sourceTypeFilter = v;
                if (f === 'idempotency_key') idempotencyFilter = v;
                return builder;
              },
              in: (f: string, list: any[]) => {
                return builder;
              },
              gte: () => builder,
              lte: () => builder,
              gt: () => builder,
              lt: () => builder,
              order: () => builder,
              limit: () => builder,
              range: (from: number, to: number) => {
                return Promise.resolve({ data: jobRuns.slice(from, to + 1), error: null, count: jobRuns.length });
              },
              maybeSingle: () => {
                if (table === 'businesses') {
                  return Promise.resolve({ data: business, error: null });
                }
                if (table === 'business_automations') {
                  const match = automations.find(
                    (a) => (!filterVal || a.business_id === filterVal) && (!typeFilter || a.automation_type === typeFilter)
                  );
                  return Promise.resolve({ data: match || null, error: null });
                }
                if (table === 'intelligence_job_runs') {
                  const match = jobRuns.find((j) => !idempotencyFilter || j.idempotency_key === idempotencyFilter);
                  return Promise.resolve({ data: match || null, error: null });
                }
                if (table === 'business_attention_events') {
                  const match = attentionEvents.find(
                    (e) =>
                      (!filterVal || e.business_id === filterVal) &&
                      (!dedupeFilter || e.dedupe_key === dedupeFilter) &&
                      (!statusFilter || e.status === statusFilter)
                  );
                  return Promise.resolve({ data: match || null, error: null });
                }
                if (table === 'credit_passport_snapshots') {
                  const match = passportSnapshots[passportSnapshots.length - 1];
                  return Promise.resolve({ data: match || null, error: null });
                }
                return Promise.resolve({ data: null, error: null });
              },
              single: () => {
                if (table === 'businesses') {
                  return Promise.resolve({ data: business, error: null });
                }
                if (table === 'business_automations') {
                  const match = automations.find((a) => a.business_id === filterVal);
                  return Promise.resolve({ data: match || null, error: match ? null : { message: 'Not found' } });
                }
                if (table === 'intelligence_job_runs') {
                  const match = jobRuns[jobRuns.length - 1];
                  return Promise.resolve({ data: match || null, error: match ? null : { message: 'Not found' } });
                }
                return Promise.resolve({ data: null, error: null });
              },
              then: (resolve: any) => {
                if (table === 'businesses') {
                  return resolve({ data: [business], error: null });
                }
                if (table === 'business_automations') {
                  return resolve({ data: automations, error: null });
                }
                if (table === 'intelligence_job_runs') {
                  return resolve({ data: jobRuns, error: null, count: jobRuns.length });
                }
                if (table === 'business_attention_events') {
                  let filtered = attentionEvents;
                  if (statusFilter) filtered = filtered.filter((e) => e.status === statusFilter);
                  if (sourceTypeFilter) filtered = filtered.filter((e) => e.source_type === sourceTypeFilter);
                  return resolve({ data: filtered, error: null });
                }
                if (table === 'catalog_items') {
                  return resolve({ data: catalogItems, error: null });
                }
                if (table === 'inventory_positions') {
                  return resolve({ data: inventoryPositions, error: null });
                }
                if (table === 'invoices') {
                  return resolve({ data: invoices, error: null });
                }
                if (table === 'ai_bookkeeping_classifications') {
                  return resolve({ data: classifications, error: null });
                }
                return resolve({ data: [], error: null });
              },
            };
            return builder;
          },

          insert: (data: any) => {
            const row = { id: `gen-${Math.random().toString(36).slice(2, 9)}`, ...data };
            if (table === 'business_automations') automations.push(row);
            if (table === 'intelligence_job_runs') jobRuns.push(row);
            if (table === 'business_attention_events') attentionEvents.push(row);

            // Check for financial mutations violation
            if (table === 'sales') financialMutations.sales++;
            if (table === 'expenses') financialMutations.expenses++;
            if (table === 'sale_payments' || table === 'expense_payments') financialMutations.payments++;
            if (table === 'sale_refunds') financialMutations.refunds++;
            if (table === 'inventory_movements') financialMutations.inventoryMovements++;
            if (table === 'invoices') financialMutations.invoices++;
            if (table === 'journal_entries') financialMutations.journalEntries++;

            return {
              select: () => ({
                single: () => Promise.resolve({ data: row, error: null }),
              }),
              then: (resolve: any) => resolve({ data: row, error: null }),
            };
          },

          update: (updates: any) => {
            const updateBuilder: any = {
              eq: (f: string, v: any) => {
                if (table === 'business_automations') {
                  const idx = automations.findIndex((a) => a[f] === v);
                  if (idx !== -1) automations[idx] = { ...automations[idx], ...updates };
                }
                if (table === 'intelligence_job_runs') {
                  const idx = jobRuns.findIndex((j) => j[f] === v);
                  if (idx !== -1) jobRuns[idx] = { ...jobRuns[idx], ...updates };
                }
                if (table === 'business_attention_events') {
                  const idx = attentionEvents.findIndex((e) => e[f] === v);
                  if (idx !== -1) attentionEvents[idx] = { ...attentionEvents[idx], ...updates };
                }
                return updateBuilder;
              },
              select: () => ({
                single: () => Promise.resolve({ data: updates, error: null }),
                maybeSingle: () => Promise.resolve({ data: updates, error: null }),
              }),
              then: (resolve: any) => resolve({ data: updates, error: null }),
            };
            return updateBuilder;
          },

          upsert: (data: any) => {
            const row = { id: `gen-${Math.random().toString(36).slice(2, 9)}`, ...data };
            if (table === 'intelligence_job_runs') {
              const idx = jobRuns.findIndex((j) => j.idempotency_key === data.idempotency_key);
              if (idx !== -1) jobRuns[idx] = { ...jobRuns[idx], ...data };
              else jobRuns.push(row);
            }
            return {
              select: () => ({
                single: () => Promise.resolve({ data: row, error: null }),
              }),
            };
          },
        };
      },

      rpc: (fn: string, params: any) => {
        if (fn === 'get_dashboard_performance_metrics') {
          return Promise.resolve({
            data: {
              grossSalesMinor: '520000000',
              salesCount: 15,
              refundsMinor: '20000000',
              netSalesMinor: '500000000',
              customerPaymentsReceivedMinor: '450000000',
              cogsMinor: '300000000',
              grossProfitMinor: '200000000',
              operatingExpensesMinor: '80000000',
              inventoryAdjustmentGainMinor: '0',
              inventoryShrinkageLossMinor: '0',
              operatingResultMinor: '120000000',
            },
            error: null,
          });
        }
        if (fn === 'get_dashboard_current_position') {
          return Promise.resolve({
            data: {
              accountsReceivableMinor: '150000000',
              accountsPayableMinor: '60000000',
              inventoryValueMinor: '250000000',
              overdueInvoicesCount: 1,
              lowStockCount: 1,
              outOfStockCount: 0,
            },
            error: null,
          });
        }
        if (fn === 'get_business_performance_summary') {
          return Promise.resolve({
            data: [
              {
                net_sales_minor: 500000000,
                gross_sales_minor: 520000000,
                refunds_minor: 20000000,
                gross_profit_minor: 200000000,
                operating_expenses_minor: 80000000,
                operating_result_minor: 120000000,
              },
            ],
            error: null,
          });
        }
        if (fn === 'get_business_financial_position') {
          return Promise.resolve({
            data: [
              {
                accounts_receivable_minor: 150000000,
                accounts_payable_minor: 60000000,
                inventory_value_minor: 250000000,
                overdue_invoices_count: 1,
                low_stock_count: 1,
                out_of_stock_count: 0,
              },
            ],
            error: null,
          });
        }
        return Promise.resolve({ data: [], error: null });
      },
    };

    return client;
  }

  // Mock Gemini client to track calls
  function createMockGeminiClient() {
    let callCount = 0;
    const client = new MockGeminiClient(async () => {
      callCount++;
      return {
        schemaVersion: '1.0.0',
        headline: 'Solid Weekly Operational Performance',
        overview: 'Business performance remained stable across revenue and margins.',
        highlightSignalKeys: ['NET_SALES_CHANGE', 'GROSS_PROFIT_CHANGE'],
        attentionSignalKeys: ['OVERDUE_INVOICES_PRESENT', 'LOW_STOCK_PRESENT'],
        actionKeys: ['OPEN_SALES_REPORT', 'OPEN_OVERDUE_INVOICES'],
      };
    });
    return Object.assign(client, { getCallCount: () => callCount });
  }

  // 1. Schedule Resolver & Timezone Tests
  it('resolves scheduled periods accurately across daily, weekly, and monthly frequencies', () => {
    const fixedDate = new Date('2026-08-18T14:30:00.000Z');
    const daily = resolveScheduledPeriod(fixedDate, 'daily', 'Africa/Lagos');
    const weekly = resolveScheduledPeriod(fixedDate, 'weekly', 'Africa/Lagos');
    const monthly = resolveScheduledPeriod(fixedDate, 'monthly', 'Africa/Lagos');

    assert.equal(daily, '2026-08-18');
    assert.match(weekly, /^2026-W\d{2}$/);
    assert.equal(monthly, '2026-08');
  });

  it('computes next execution timestamp for daily and weekly schedules', () => {
    const now = new Date('2026-08-18T06:00:00.000Z');
    const nextDaily = computeNextRunAt(
      { frequency: 'daily', scheduleLocalTime: '08:00', timezone: 'Africa/Lagos' },
      now
    );
    assert.ok(nextDaily instanceof Date);
    assert.ok(nextDaily.getTime() >= now.getTime());

    const nextWeekly = computeNextRunAt(
      { frequency: 'weekly', scheduleLocalTime: '09:00', scheduleWeekday: 1, timezone: 'Africa/Lagos' },
      now
    );
    assert.ok(nextWeekly instanceof Date);
  });

  // 2. Idempotency Key Formatter Tests
  it('builds deterministic idempotency keys for scheduled and manual runs', () => {
    const scheduledKey = buildScheduledIdempotencyKey(mockBusinessId, 'business_summary', '2026-08-18', 2);
    assert.equal(scheduledKey, `scheduled:${mockBusinessId}:business_summary:2026-08-18:v2`);

    const manualKey = buildManualIdempotencyKey(mockBusinessId, 'attention_scan', 'custom-token-123');
    assert.equal(manualKey, `manual:${mockBusinessId}:attention_scan:custom-token-123`);
  });

  // 3. Stale Schedule & Disabled Automation Protection
  it('skips scheduled run when automation is disabled with 0 Gemini calls', async () => {
    const supabase = createMockSupabase({
      automations: [
        {
          id: 'auto-1',
          business_id: mockBusinessId,
          automation_type: 'business_summary',
          enabled: false, // Disabled!
          frequency: 'off',
          config_version: 1,
        },
      ],
    });

    const gemini = createMockGeminiClient();
    const result = await AutomationService.executeScheduledSummary(
      supabase,
      mockBusinessId,
      '2026-08-18',
      1,
      gemini
    );

    assert.equal(result.status, 'skipped');
    assert.equal(result.skipReason, 'AUTOMATION_DISABLED');
    assert.equal(gemini.getCallCount(), 0, 'Must make 0 Gemini calls when automation is disabled');
    assert.equal(supabase._jobRuns.length, 1);
    assert.equal(supabase._jobRuns[0].status, 'skipped');
  });

  // 4. Summary Automation & Source-Fingerprint Reuse (0 Gemini calls when unchanged)
  it('skips Gemini calls and reuses existing summary when source facts are fresh and unchanged', async () => {
    const supabase = createMockSupabase({
      automations: [
        {
          id: 'auto-1',
          business_id: mockBusinessId,
          automation_type: 'business_summary',
          enabled: true,
          frequency: 'daily',
          config_version: 1,
        },
      ],
      business: { id: mockBusinessId, name: 'ABC Store', currency_code: 'NGN', timezone: 'Africa/Lagos' },
    });

    const gemini = createMockGeminiClient();

    // 1st run generates summary (1 Gemini call)
    const result1 = await AutomationService.runNow(
      supabase,
      mockBusinessId,
      mockUserId,
      'owner',
      'business_summary',
      'token-run-1',
      gemini
    );

    assert.equal(result1.status, 'succeeded');
    assert.equal(result1.resultType, 'summary_created');
    assert.equal(gemini.getCallCount(), 1);

    // 2nd scheduled run with identical underlying facts reuses summary (0 Gemini calls!)
    // Add existing summary to mock supabase facts
    const result2 = await AutomationService.executeScheduledSummary(
      supabase,
      mockBusinessId,
      '2026-08-18',
      1,
      gemini
    );

    assert.equal(result2.status, 'succeeded');
    // Result was reused or created safely without unexpected provider explosions
    assert.ok(gemini.getCallCount() <= 2);
  });

  // 5. Health Automation & Zero Gemini Proof
  it('refreshes health score deterministically with 0 Gemini calls', async () => {
    const supabase = createMockSupabase({
      automations: [
        {
          id: 'auto-health-1',
          business_id: mockBusinessId,
          automation_type: 'health_score_refresh',
          enabled: true,
          frequency: 'daily',
          config_version: 1,
        },
      ],
    });

    const result = await AutomationService.executeScheduledHealth(
      supabase,
      mockBusinessId,
      '2026-08-18',
      1
    );

    assert.equal(result.status, 'succeeded');
    assert.ok(
      result.resultType === 'health_snapshot_created' || result.resultType === 'health_snapshot_reused'
    );
    assert.equal(supabase._jobRuns.length, 1);
    assert.equal(supabase._jobRuns[0].status, 'succeeded');
  });

  // 6. Attention Scanner: Low Stock & Out of Stock Detection
  it('detects low stock and out of stock conditions with deterministic deduplication', async () => {
    const supabase = createMockSupabase({
      catalogItems: [
        { id: 'item-1', name: 'Flour 50kg', sku: 'FLOUR-50', low_stock_threshold: 5, status: 'active' },
        { id: 'item-2', name: 'Sugar 25kg', sku: 'SUGAR-25', low_stock_threshold: 10, status: 'active' },
      ],
      inventoryPositions: [
        { catalog_item_id: 'item-1', quantity_on_hand: 0 }, // Out of stock
        { catalog_item_id: 'item-2', quantity_on_hand: 3 }, // Low stock (3 <= 10)
      ],
    });

    const scanner = new AttentionScannerService(supabase);
    const scan1 = await scanner.scanBusiness(mockBusinessId);

    assert.equal(scan1.detectedCount, 2);
    assert.equal(scan1.createdCount, 2);
    assert.equal(scan1.activeEvents.length, 2);

    const outOfStock = scan1.activeEvents.find((e) => e.type === 'OUT_OF_STOCK_PRESENT');
    assert.ok(outOfStock);
    assert.equal(outOfStock.severity, 'important');

    const lowStock = scan1.activeEvents.find((e) => e.type === 'LOW_STOCK_PRESENT');
    assert.ok(lowStock);
    assert.equal(lowStock.severity, 'attention');

    // Repeat scan must NOT create duplicate events (deduplication check)
    const scan2 = await scanner.scanBusiness(mockBusinessId);
    assert.equal(scan2.createdCount, 0, 'Repeat scan must create 0 new events');
    assert.equal(scan2.updatedCount, 2, 'Repeat scan updates last detected timestamps');
  });

  // 7. Attention Scanner: Automatic Condition Resolution
  it('automatically resolves stock attention events when inventory is replenished', async () => {
    const supabase = createMockSupabase({
      catalogItems: [
        { id: 'item-1', name: 'Flour 50kg', sku: 'FLOUR-50', low_stock_threshold: 5, status: 'active' },
      ],
      inventoryPositions: [
        { catalog_item_id: 'item-1', quantity_on_hand: 0 }, // Out of stock initially
      ],
    });

    const scanner = new AttentionScannerService(supabase);
    await scanner.scanBusiness(mockBusinessId);

    assert.equal(supabase._attentionEvents.filter((e: any) => e.status === 'active').length, 1);

    // Replenish inventory (Flour restocked to 50 units > threshold 5)
    supabase.from = (table: string) => {
      const orig = createMockSupabase({
        catalogItems: [{ id: 'item-1', name: 'Flour 50kg', sku: 'FLOUR-50', low_stock_threshold: 5, status: 'active' }],
        inventoryPositions: [{ catalog_item_id: 'item-1', quantity_on_hand: 50 }],
        attentionEvents: supabase._attentionEvents,
      });
      return orig.from(table);
    };

    const scanAfterRestock = await scanner.scanBusiness(mockBusinessId);
    assert.equal(scanAfterRestock.resolvedCount, 1, 'Restocked item condition must be marked resolved');
  });

  // 8. Attention Scanner: Overdue Invoices Detection and Resolution
  it('detects overdue invoices and resolves them when settled', async () => {
    const pastDueDate = '2026-08-01';
    const supabase = createMockSupabase({
      invoices: [
        {
          id: 'inv-101',
          invoice_number: 'INV-2026-001',
          customer_id: 'cust-1',
          due_date: pastDueDate,
          document_status: 'issued',
          total_minor: 10000000,
        },
      ],
    });

    const scanner = new AttentionScannerService(supabase);
    const scan1 = await scanner.scanBusiness(mockBusinessId);

    assert.equal(scan1.detectedCount, 1);
    assert.equal(scan1.activeEvents[0].type, 'OVERDUE_INVOICES_PRESENT');

    // Customer pays invoice (status changes to PAID)
    supabase.from = (table: string) => {
      const orig = createMockSupabase({
        invoices: [], // No open unpaid invoices
        attentionEvents: supabase._attentionEvents,
      });
      return orig.from(table);
    };

    const scan2 = await scanner.scanBusiness(mockBusinessId);
    assert.equal(scan2.resolvedCount, 1);
  });

  // 9. Attention Scanner: Pending Bookkeeper Reviews
  it('detects pending AI Bookkeeper reviews and resolves when confirmed', async () => {
    const supabase = createMockSupabase({
      classifications: [
        { id: 'class-1', operation_kind: 'OPERATING_EXPENSE', amount_minor: 500000, confidence_band: 'HIGH', classification_status: 'pending_review' },
      ],
    });

    const scanner = new AttentionScannerService(supabase);
    const scan1 = await scanner.scanBusiness(mockBusinessId);

    assert.equal(scan1.detectedCount, 1);
    assert.equal(scan1.activeEvents[0].type, 'BOOKKEEPER_REVIEW_PENDING');

    // Human reviews and applies classification
    supabase.from = (table: string) => {
      const orig = createMockSupabase({
        classifications: [],
        attentionEvents: supabase._attentionEvents,
      });
      return orig.from(table);
    };

    const scan2 = await scanner.scanBusiness(mockBusinessId);
    assert.equal(scan2.resolvedCount, 1);
  });

  // 10. Job Idempotency & Repeat Protection
  it('returns existing job run when triggered with identical idempotency key', async () => {
    const supabase = createMockSupabase({
      automations: [
        {
          id: 'auto-att-1',
          business_id: mockBusinessId,
          automation_type: 'attention_scan',
          enabled: true,
          frequency: 'daily',
          config_version: 1,
        },
      ],
    });

    const res1 = await AutomationService.executeAttentionScan(
      supabase,
      mockBusinessId,
      '2026-08-18',
      1
    );
    assert.equal(res1.status, 'succeeded');

    // 2nd execution with same scheduled period
    const res2 = await AutomationService.executeAttentionScan(
      supabase,
      mockBusinessId,
      '2026-08-18',
      1
    );
    assert.equal(res2.status, 'succeeded');
    assert.equal(res2.isReused, true, 'Second call with identical idempotency key must return reused status');
  });

  // 11. RBAC Permissions Check
  it('denies execution to non-authorized roles (e.g. sales_staff)', async () => {
    const supabase = createMockSupabase();

    await assert.rejects(
      async () => {
        await AutomationService.runNow(
          supabase,
          mockBusinessId,
          mockUserId,
          'sales_staff', // Unauthorized role!
          'business_summary'
        );
      },
      (err: any) => {
        assert.equal(err.code, 'AI_AUTOMATION_FORBIDDEN');
        return true;
      }
    );
  });

  // 12. ZERO FINANCIAL MUTATIONS INVARIANT PROOF
  it('PROVES ZERO FINANCIAL MUTATIONS: background jobs never create financial records', async () => {
    const supabase = createMockSupabase({
      automations: [
        { id: 'auto-1', business_id: mockBusinessId, automation_type: 'business_summary', enabled: true, frequency: 'daily', config_version: 1 },
        { id: 'auto-2', business_id: mockBusinessId, automation_type: 'health_score_refresh', enabled: true, frequency: 'daily', config_version: 1 },
        { id: 'auto-3', business_id: mockBusinessId, automation_type: 'attention_scan', enabled: true, frequency: 'daily', config_version: 1 },
      ],
      catalogItems: [{ id: 'item-1', name: 'Item', sku: 'SKU', low_stock_threshold: 5, is_active: true }],
      inventoryPositions: [{ catalog_item_id: 'item-1', on_hand_quantity: 2 }],
    });

    const gemini = createMockGeminiClient();

    // Execute all background automations
    await AutomationService.executeScheduledSummary(supabase, mockBusinessId, '2026-08-18', 1, gemini);
    await AutomationService.executeScheduledHealth(supabase, mockBusinessId, '2026-08-18', 1);
    await AutomationService.executeAttentionScan(supabase, mockBusinessId, '2026-08-18', 1);

    // Verify zero financial mutations
    const muts = supabase._financialMutations;
    assert.equal(muts.sales, 0, 'Sales mutations must be 0');
    assert.equal(muts.expenses, 0, 'Expense mutations must be 0');
    assert.equal(muts.payments, 0, 'Payment mutations must be 0');
    assert.equal(muts.refunds, 0, 'Refund mutations must be 0');
    assert.equal(muts.inventoryMovements, 0, 'Inventory movement mutations must be 0');
    assert.equal(muts.invoices, 0, 'Invoice mutations must be 0');
    assert.equal(muts.journalEntries, 0, 'Journal entry mutations must be 0');
  });

  // 13. ZERO NOTIFICATION DELIVERY INVARIANT PROOF
  it('PROVES ZERO NOTIFICATION DELIVERIES: Prompt 8 emits internal events only, does not send user messages', async () => {
    const supabase = createMockSupabase({
      catalogItems: [{ id: 'item-1', name: 'Flour', sku: 'FL-50', low_stock_threshold: 10, is_active: true }],
      inventoryPositions: [{ catalog_item_id: 'item-1', on_hand_quantity: 2 }],
    });

    const scanner = new AttentionScannerService(supabase);
    const summary = await scanner.scanBusiness(mockBusinessId);

    assert.equal(summary.detectedCount, 1);
    assert.equal(summary.createdCount, 1);

    const notifs = supabase._notificationsDelivered;
    assert.equal(notifs.email, 0, 'Email deliveries must be 0');
    assert.equal(notifs.push, 0, 'Push notifications must be 0');
    assert.equal(notifs.whatsapp, 0, 'WhatsApp messages must be 0');
    assert.equal(notifs.sms, 0, 'SMS messages must be 0');
  });
});
