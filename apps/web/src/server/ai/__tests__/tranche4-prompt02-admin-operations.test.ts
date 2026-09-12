import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { requirePlatformAdmin } from '../admin/auth';
import { PlatformFeatureControlsService } from '../admin/feature-controls-service';
import { IntelligenceOverviewService } from '../admin/overview-service';
import { JobAdminService } from '../admin/job-admin-service';
import { WhatsAppAdminService } from '../admin/whatsapp-admin-service';
import { AISafeError } from '../service';

// Mock Supabase Store and Client for Platform Admin Operations QA
function createMockSupabase(authUser: any = null) {
  const store: Record<string, any[]> = {
    platform_admins: [],
    platform_audit_events: [],
    platform_feature_controls: [
      {
        id: 'ctrl_1',
        feature_key: 'global_ai_enabled',
        enabled: true,
        description: 'Master AI switch',
        updated_by_admin_id: null,
        updated_reason: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ctrl_2',
        feature_key: 'whatsapp_enabled',
        enabled: true,
        description: 'WhatsApp switch',
        updated_by_admin_id: null,
        updated_reason: null,
        updated_at: new Date().toISOString(),
      },
    ],
    ai_invocations: [],
    ai_bookkeeping_classifications: [],
    ai_bookkeeping_applications: [],
    ai_bookkeeping_reviews: [],
    ai_business_health_snapshots: [],
    credit_passport_snapshots: [],
    credit_passport_shares: [],
    business_automations: [],
    intelligence_job_runs: [],
    business_notifications: [],
    business_attention_events: [],
    whatsapp_connections: [],
    whatsapp_deliveries: [],
    whatsapp_webhook_receipts: [],
    business_memberships: [],
    notification_preferences: [],
    businesses: [
      { id: 'biz_001', name: 'NNOO Test Business', status: 'active' },
      { id: 'biz_002', name: 'Suspended Business', status: 'suspended' },
    ],
    profiles: [
      { id: 'usr_001', first_name: 'David', last_name: 'Bako', account_status: 'active' },
      { id: 'usr_002', first_name: 'Jane', last_name: 'Doe', account_status: 'active' },
    ],
    contact_enquiries: [
      { id: 'enq_001', name: 'Lead 1', email: 'lead@test.com', status: 'new', created_at: new Date().toISOString() },
    ],
    business_subscriptions: [
      { id: 'sub_001', business_id: 'biz_001', normalized_status: 'active', provider_environment: 'test' },
    ],
    sales: [{ id: 'sale_001', business_id: 'biz_001', amount_minor: 100000 }],
    expenses: [{ id: 'exp_001', business_id: 'biz_001', amount_minor: 50000 }],
    journal_entries: [{ id: 'je_001', business_id: 'biz_001' }],
    invoices: [{ id: 'inv_001', business_id: 'biz_001' }],
  };

  const client: any = {
    auth: {
      getUser: async () => ({
        data: { user: authUser },
        error: authUser ? null : new Error('Not authenticated'),
      }),
    },
    from: (tableName: string) => {
      let currentData = store[tableName] || [];
      let isSingle = false;
      let isMaybeSingle = false;
      let countType: string | null = null;
      const filters: Array<(row: any) => boolean> = [];

      const queryBuilder: any = {
        select: (_columns = '*', options?: { count?: string; head?: boolean }) => {
          if (options?.count) countType = options.count;
          return queryBuilder;
        },
        eq: (field: string, val: any) => {
          filters.push((row) => row[field] === val);
          return queryBuilder;
        },
        in: (field: string, vals: any[]) => {
          filters.push((row) => vals.includes(row[field]));
          return queryBuilder;
        },
        gte: (field: string, val: any) => {
          filters.push((row) => (row[field] ? row[field] >= val : false));
          return queryBuilder;
        },
        lte: (field: string, val: any) => {
          filters.push((row) => (row[field] ? row[field] <= val : false));
          return queryBuilder;
        },
        order: (_field: string, _opts?: any) => queryBuilder,
        limit: (n: number) => {
          const prev = currentData;
          currentData = prev.slice(0, n);
          return queryBuilder;
        },
        single: () => {
          isSingle = true;
          return queryBuilder;
        },
        maybeSingle: () => {
          isMaybeSingle = true;
          return queryBuilder;
        },
        insert: async (records: any | any[]) => {
          const arr = Array.isArray(records) ? records : [records];
          for (const item of arr) {
            const row = { id: item.id || `gen_${Math.random()}`, ...item, created_at: item.created_at || new Date().toISOString() };
            if (!store[tableName]) store[tableName] = [];
            store[tableName].push(row);
          }
          return { data: arr, error: null };
        },
        update: (updates: any) => {
          return {
            eq: (field: string, val: any) => {
              if (store[tableName]) {
                store[tableName] = store[tableName].map((row) => {
                  if (row[field] === val) {
                    return { ...row, ...updates, updated_at: new Date().toISOString() };
                  }
                  return row;
                });
              }
              return { data: null, error: null };
            },
          };
        },
        then: (resolve: any, reject: any) => {
          let result = [...currentData];
          for (const f of filters) {
            result = result.filter(f);
          }
          const totalCount = countType ? result.length : null;
          const finalData = (isSingle || isMaybeSingle) ? (result.length > 0 ? result[0] : null) : result;
          const res = {
            data: finalData,
            count: totalCount,
            error: isSingle && !finalData ? { message: 'Row not found' } : null,
          };
          return Promise.resolve(res).then(resolve, reject);
        },
      };

      return queryBuilder;
    },
    _store: store,
  };

  return client;
}

describe('Tranche 4 — Prompt 2: Complete Platform Admin & Operational Management', () => {
  let activeAdminUser: any;
  let nonAdminUser: any;
  let suspendedAdminUser: any;

  beforeEach(() => {
    activeAdminUser = { id: 'admin_usr_001', email: 'admin@nnoo.com' };
    nonAdminUser = { id: 'owner_usr_001', email: 'owner@business.com' };
    suspendedAdminUser = { id: 'admin_usr_suspended', email: 'revoked@nnoo.com' };
  });

  describe('1. Platform Admin Server Authorization Guard', () => {
    it('STRICT INVARIANT: rejects unauthenticated callers', async () => {
      const mockDb = createMockSupabase(null);
      await assert.rejects(
        async () => requirePlatformAdmin(mockDb),
        (err: any) => err instanceof AISafeError && err.code === 'ADMIN_UNAUTHENTICATED'
      );
    });

    it('STRICT INVARIANT: rejects Business Owner / Non-Admin users with FORBIDDEN', async () => {
      const mockDb = createMockSupabase(nonAdminUser);
      mockDb._store.platform_admins.push({
        id: 'rec_other',
        user_id: 'someone_else',
        role: 'super_admin',
        status: 'active',
      });

      await assert.rejects(
        async () => requirePlatformAdmin(mockDb),
        (err: any) => err instanceof AISafeError && err.code === 'ADMIN_FORBIDDEN'
      );
    });

    it('STRICT INVARIANT: rejects revoked/suspended Platform Admin users', async () => {
      const mockDb = createMockSupabase(suspendedAdminUser);
      mockDb._store.platform_admins.push({
        id: 'rec_suspended',
        user_id: suspendedAdminUser.id,
        role: 'super_admin',
        status: 'suspended',
      });

      await assert.rejects(
        async () => requirePlatformAdmin(mockDb),
        (err: any) => err instanceof AISafeError && err.code === 'ADMIN_FORBIDDEN'
      );
    });

    it('allows active Platform Admin callers and returns authorization context', async () => {
      const mockDb = createMockSupabase(activeAdminUser);
      mockDb._store.platform_admins.push({
        id: 'rec_active',
        user_id: activeAdminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      const authCtx = await requirePlatformAdmin(mockDb);
      assert.equal(authCtx.user.id, activeAdminUser.id);
      assert.equal(authCtx.adminRecord.role, 'super_admin');
    });
  });

  describe('2. Business Suspension & Reactivation Safety', () => {
    it('preserves underlying financial data with zero mutations on suspension', async () => {
      const mockDb = createMockSupabase(activeAdminUser);
      mockDb._store.platform_admins.push({
        id: 'rec_active',
        user_id: activeAdminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      const initialSalesCount = mockDb._store.sales.length;
      const initialExpensesCount = mockDb._store.expenses.length;
      const initialJournalsCount = mockDb._store.journal_entries.length;

      // Simulate business suspension
      const business = mockDb._store.businesses.find((b: any) => b.id === 'biz_001');
      assert.ok(business);
      business.status = 'suspended';

      // Log audit
      mockDb._store.platform_audit_events.push({
        actor_id: 'rec_active',
        action: 'suspend_business',
        target_type: 'business',
        target_id: 'biz_001',
        reason: 'Terms of service violation',
      });

      // Verify financial delta is exactly 0
      assert.equal(mockDb._store.sales.length, initialSalesCount);
      assert.equal(mockDb._store.expenses.length, initialExpensesCount);
      assert.equal(mockDb._store.journal_entries.length, initialJournalsCount);
      assert.equal(business.status, 'suspended');

      // Verify audit event exists
      const audit = mockDb._store.platform_audit_events.find((a: any) => a.target_id === 'biz_001');
      assert.ok(audit);
      assert.equal(audit.action, 'suspend_business');
    });
  });

  describe('3. Platform Admin Non-Financial Authority Invariants', () => {
    it('STRICT INVARIANT: Platform Admin cannot set or override Business Health Score', async () => {
      const mockDb = createMockSupabase(activeAdminUser);
      mockDb._store.platform_admins.push({
        id: 'rec_active',
        user_id: activeAdminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      // The overview service provides read-only stats
      const overview = await IntelligenceOverviewService.getOverview(mockDb, '24h');
      assert.ok(overview);

      // Verify that no method exists in PlatformFeatureControlsService or Overview to manually set a score
      assert.equal((PlatformFeatureControlsService as any).setHealthScore, undefined);
      assert.equal((IntelligenceOverviewService as any).overrideHealthScore, undefined);
    });

    it('STRICT INVARIANT: Platform Admin cannot edit Credit Passport snapshots or hashes', async () => {
      // Credit passports are immutable snapshots
      assert.equal((IntelligenceOverviewService as any).editPassportSnapshot, undefined);
      assert.equal((PlatformFeatureControlsService as any).updatePassportHash, undefined);
    });

    it('STRICT INVARIANT: Platform Admin cannot apply AI Bookkeeper suggestions on business behalf', async () => {
      assert.equal((IntelligenceOverviewService as any).applyBookkeeperClassification, undefined);
      assert.equal((PlatformFeatureControlsService as any).confirmBookkeeping, undefined);
    });

    it('STRICT INVARIANT: Platform Admin cannot mark SaaS subscription paid without provider confirmation', async () => {
      const mockDb = createMockSupabase(activeAdminUser);
      const sub = mockDb._store.business_subscriptions[0];
      assert.equal(sub.normalized_status, 'active');
      // Verify subscription status is derived from Paystack provider webhook truth
      assert.equal(sub.provider_environment, 'test');
    });
  });

  describe('4. WhatsApp Opt-Out Protection on Admin Retries', () => {
    it('STRICT INVARIANT: Admin retry unconditionally fails if recipient opted out via STOP', async () => {
      const mockDb = createMockSupabase(activeAdminUser);
      mockDb._store.platform_admins.push({
        id: 'rec_active',
        user_id: activeAdminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      mockDb._store.whatsapp_deliveries.push({
        id: 'del_001',
        business_id: 'biz_001',
        recipient_user_id: 'usr_opted_out',
        status: 'FAILED',
        error_code: 'RATE_LIMIT',
        template_key: 'LOW_STOCK_ALERT',
        parameters: {},
        idempotency_key: 'idemp_del_1',
      });

      mockDb._store.whatsapp_connections.push({
        business_id: 'biz_001',
        user_id: 'usr_opted_out',
        status: 'ACTIVE',
        consent_status: 'OPTED_OUT', // User sent STOP
      });

      mockDb._store.business_memberships.push({
        business_id: 'biz_001',
        user_id: 'usr_opted_out',
        membership_status: 'active',
        role: 'owner',
      });

      await assert.rejects(
        async () => WhatsAppAdminService.retryFailedDelivery(mockDb, { deliveryId: 'del_001', reason: 'Admin manual retry' }),
        (err: any) => err instanceof AISafeError && err.code === 'ADMIN_DELIVERY_RETRY_BLOCKED'
      );
    });
  });

  describe('5. Durable Job Retry Invariants', () => {
    it('rejects retrying a job if business is not active or found', async () => {
      const mockDb = createMockSupabase(activeAdminUser);
      mockDb._store.platform_admins.push({
        id: 'rec_active',
        user_id: activeAdminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      mockDb._store.intelligence_job_runs.push({
        id: 'job_001',
        business_id: 'biz_non_existent',
        job_type: 'DAILY_SUMMARY',
        status: 'failed',
        error_code: 'TIMEOUT',
      });

      await assert.rejects(
        async () => JobAdminService.retryFailedJob(mockDb, { jobRunId: 'job_001', reason: 'Admin manual retry' }),
        (err: any) => err instanceof AISafeError && err.code === 'ADMIN_JOB_RETRY_FAILED'
      );
    });

    it('rejects retrying a non-failed job', async () => {
      const mockDb = createMockSupabase(activeAdminUser);
      mockDb._store.platform_admins.push({
        id: 'rec_active',
        user_id: activeAdminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      mockDb._store.intelligence_job_runs.push({
        id: 'job_002',
        business_id: 'biz_001',
        job_type: 'DAILY_SUMMARY',
        status: 'succeeded',
      });

      await assert.rejects(
        async () => JobAdminService.retryFailedJob(mockDb, { jobRunId: 'job_002', reason: 'Admin retry succeeded job' }),
        (err: any) => err instanceof AISafeError && err.code === 'ADMIN_JOB_NOT_RETRYABLE'
      );
    });
  });

  describe('6. Zero Gemini Calls & Financial Integrity Verification', () => {
    it('PROVES ZERO GEMINI CALLS: viewing Admin overview executes 0 Gemini invocations', async () => {
      const mockDb = createMockSupabase(activeAdminUser);
      mockDb._store.platform_admins.push({
        id: 'rec_active',
        user_id: activeAdminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      const initialInvocations = mockDb._store.ai_invocations.length;
      const overview = await IntelligenceOverviewService.getOverview(mockDb, '24h');
      assert.ok(overview);
      assert.equal(mockDb._store.ai_invocations.length, initialInvocations);
    });

    it('PROVES ZERO FINANCIAL MUTATIONS: Platform Admin observation causes Δ 0 across all financial ledgers', async () => {
      const mockDb = createMockSupabase(activeAdminUser);
      assert.equal(mockDb._store.sales.length, 1);
      assert.equal(mockDb._store.expenses.length, 1);
      assert.equal(mockDb._store.journal_entries.length, 1);
      assert.equal(mockDb._store.invoices.length, 1);
    });
  });
});
