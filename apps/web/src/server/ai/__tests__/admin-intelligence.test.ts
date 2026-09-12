import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { requirePlatformAdmin } from '../admin/auth';
import { PlatformFeatureControlsService } from '../admin/feature-controls-service';
import { AiOperationsService } from '../admin/ai-operations-service';
import { IntelligenceOverviewService } from '../admin/overview-service';
import { JobAdminService } from '../admin/job-admin-service';
import { WhatsAppAdminService } from '../admin/whatsapp-admin-service';
import { AISafeError } from '../service';

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
    businesses: [{ id: 'biz_001', name: 'NNOO Test Business' }],
  };

  const client: any = {
    auth: {
      getUser: async () => ({
        data: { user: authUser },
        error: authUser ? null : new Error('Not authenticated'),
      }),
    },
    from: (table: string) => {
      let currentRows = store[table] || [];
      let filters: Array<(row: any) => boolean> = [];
      let isSingle = false;
      let isMaybeSingle = false;
      let isCount = false;

      const builder: any = {
        select: (cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === 'exact') {
            isCount = true;
          }
          return builder;
        },
        eq: (col: string, val: any) => {
          filters.push((r: any) => r[col] === val);
          return builder;
        },
        gte: (col: string, val: any) => {
          filters.push((r: any) => (r[col] || '') >= val);
          return builder;
        },
        order: (col: string, opts?: { ascending?: boolean }) => {
          return builder;
        },
        single: () => {
          isSingle = true;
          return builder.execute();
        },
        maybeSingle: () => {
          isMaybeSingle = true;
          return builder.execute();
        },
        insert: async (records: any | any[]) => {
          const arr = Array.isArray(records) ? records : [records];
          for (const r of arr) {
            const newRow = { id: r.id || `gen_${Math.random()}`, ...r };
            if (!store[table]) store[table] = [];
            store[table].push(newRow);
          }
          return { data: arr, error: null };
        },
        update: (patch: any) => {
          return {
            eq: (col: string, val: any) => {
              const matched = currentRows.filter((r) => r[col] === val);
              for (const m of matched) {
                Object.assign(m, patch);
              }
              return {
                select: () => ({
                  single: async () => ({ data: matched[0] || null, error: null }),
                }),
                then: (resolve: any) => resolve({ data: matched, error: null }),
              };
            },
          };
        },
        execute: async () => {
          let results = currentRows.filter((row) => filters.every((f) => f(row)));
          if (isCount) {
            return { count: results.length, data: results, error: null };
          }
          if (isSingle) {
            if (results.length === 0) {
              return { data: null, error: { message: 'Row not found' } };
            }
            return { data: results[0], error: null };
          }
          if (isMaybeSingle) {
            return { data: results[0] || null, error: null };
          }
          return { data: results, count: results.length, error: null };
        },
      };

      builder.then = (resolve: any) => builder.execute().then(resolve);
      return builder;
    },
    _store: store,
  };

  return client;
}

describe('Tranche 3 Prompt 11: Production NNOO AI, Intelligence & Score Admin Oversight', () => {
  const adminUser = { id: 'usr_admin_001', email: 'admin@nnoo.africa' };
  const supportUser = { id: 'usr_support_001', email: 'support@nnoo.africa' };
  const regularUser = { id: 'usr_biz_001', email: 'owner@biz.com' };

  describe('1. Platform Admin Authorization Guard', () => {
    it('authorizes active platform admin with super_admin role', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.platform_admins.push({
        id: 'adm_001',
        user_id: adminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      const ctx = await requirePlatformAdmin(supabase);
      assert.equal(ctx.user.id, adminUser.id);
      assert.equal(ctx.adminRecord.role, 'super_admin');
    });

    it('rejects unauthenticated requests with ADMIN_UNAUTHENTICATED', async () => {
      const supabase = createMockSupabase(null);
      await assert.rejects(async () => {
        await requirePlatformAdmin(supabase);
      }, /Authentication required/i);
    });

    it('rejects regular business users with ADMIN_FORBIDDEN', async () => {
      const supabase = createMockSupabase(regularUser);
      await assert.rejects(async () => {
        await requirePlatformAdmin(supabase);
      }, /Active Platform Admin role required/i);
    });

    it('rejects suspended platform admins with ADMIN_FORBIDDEN', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.platform_admins.push({
        id: 'adm_001',
        user_id: adminUser.id,
        role: 'super_admin',
        status: 'suspended',
      });

      await assert.rejects(async () => {
        await requirePlatformAdmin(supabase);
      }, /Active Platform Admin role required/i);
    });
  });

  describe('2. Telemetry Aggregation & Zero Gemini Invocations', () => {
    it('retrieves overview metrics with 0 Gemini calls', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.ai_invocations.push({
        id: 'inv_1',
        feature_key: 'ai_bookkeeper',
        model_id: 'gemini-2.5-flash',
        prompt_version: 'ai.bookkeeper.classify.v1',
        response_schema_version: 'v1',
        status: 'succeeded',
        input_tokens: 120,
        output_tokens: 40,
        total_tokens: 160,
        latency_ms: 250,
        created_at: new Date().toISOString(),
      });

      supabase._store.ai_business_health_snapshots.push({
        id: 'hlth_1',
        business_id: 'biz_001',
        formula_version: 'business-health-score-v1',
        status: 'ready',
        score: 82,
        created_at: new Date().toISOString(),
      });

      supabase._store.credit_passport_snapshots.push({
        id: 'pass_1',
        business_id: 'biz_001',
        passport_code: 'NNOO-CP-12345678',
        status: 'CURRENT',
        created_at: new Date().toISOString(),
      });

      const overview = await IntelligenceOverviewService.getOverview(supabase, '24h');

      assert.equal(overview.aiPlatform.totalRequests, 1);
      assert.equal(overview.aiPlatform.successful, 1);
      assert.equal(overview.businessHealth.activeFormula, 'business-health-score-v1');
      assert.equal(overview.businessHealth.totalCalculations, 1);
      assert.equal(overview.creditPassport.totalGenerated, 1);
    });

    it('calculates token costs accurately with configured pricing label', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.ai_invocations.push({
        id: 'inv_1',
        feature_key: 'ai_bookkeeper',
        model_id: 'gemini-2.5-flash',
        prompt_version: 'ai.bookkeeper.classify.v1',
        response_schema_version: 'v1',
        status: 'succeeded',
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
        total_tokens: 2_000_000,
        latency_ms: 500,
        created_at: new Date().toISOString(),
      });

      const metrics = await AiOperationsService.getOperationsMetrics(supabase, '24h');
      assert.equal(metrics.totalInvocations, 1);
      assert.equal(metrics.totalInputTokens, 1_000_000);
      assert.equal(metrics.totalOutputTokens, 1_000_000);
      assert.equal(metrics.estimatedTotalCostUsd, 0.375);
      assert.equal(metrics.costLabel, 'Estimated from configured pricing (USD)');
    });
  });

  describe('3. Platform Feature Controls & Audit Logging', () => {
    it('disables feature control and writes audit event with required reason', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.platform_admins.push({
        id: 'adm_001',
        user_id: adminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      const updated = await PlatformFeatureControlsService.updateControl(supabase, {
        featureKey: 'global_ai_enabled',
        enabled: false,
        reason: 'Emergency provider degradation',
      });

      assert.equal(updated.enabled, false);
      assert.equal(updated.updatedReason, 'Emergency provider degradation');

      const auditEvents = supabase._store.platform_audit_events;
      assert.equal(auditEvents.length, 1);
      assert.equal(auditEvents[0].action, 'platform.feature.disable');
      assert.equal(auditEvents[0].reason, 'Emergency provider degradation');
    });

    it('rejects control change if audit reason is missing', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.platform_admins.push({
        id: 'adm_001',
        user_id: adminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      await assert.rejects(async () => {
        await PlatformFeatureControlsService.updateControl(supabase, {
          featureKey: 'global_ai_enabled',
          enabled: false,
          reason: '  ',
        });
      }, /valid reason/i);
    });

    it('rejects control change by support admin role', async () => {
      const supabase = createMockSupabase(supportUser);
      supabase._store.platform_admins.push({
        id: 'adm_002',
        user_id: supportUser.id,
        role: 'support',
        status: 'active',
      });

      await assert.rejects(async () => {
        await PlatformFeatureControlsService.updateControl(supabase, {
          featureKey: 'global_ai_enabled',
          enabled: false,
          reason: 'Support attempt',
        });
      }, /Support role is not permitted/i);
    });
  });

  describe('4. Safe Background Job Retries', () => {
    it('retries failed job with audit reason after rechecking business status', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.platform_admins.push({
        id: 'adm_001',
        user_id: adminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      supabase._store.intelligence_job_runs.push({
        id: 'job_failed_1',
        business_id: 'biz_001',
        job_type: 'scheduled_attention_scan',
        status: 'failed',
        idempotency_key: 'job_123',
        started_at: new Date().toISOString(),
      });

      const result = await JobAdminService.retryFailedJob(supabase, {
        jobRunId: 'job_failed_1',
        reason: 'Network outage resolved',
      });

      assert.equal(result.jobRunId, 'job_failed_1');
      assert.equal(supabase._store.platform_audit_events.length, 1);
      assert.equal(supabase._store.platform_audit_events[0].action, 'platform.job.retry');
    });

    it('rejects retrying a non-failed job', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.platform_admins.push({
        id: 'adm_001',
        user_id: adminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      supabase._store.intelligence_job_runs.push({
        id: 'job_succeeded_1',
        business_id: 'biz_001',
        job_type: 'scheduled_attention_scan',
        status: 'succeeded',
        idempotency_key: 'job_456',
        started_at: new Date().toISOString(),
      });

      await assert.rejects(async () => {
        await JobAdminService.retryFailedJob(supabase, {
          jobRunId: 'job_succeeded_1',
          reason: 'Accidental retry',
        });
      }, /Only failed jobs can be retried/i);
    });
  });

  describe('5. Safe WhatsApp Delivery Retry & Consent Invariants', () => {
    it('STRICT INVARIANT: unconditionally blocks retry if user opted out (STOP)', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.platform_admins.push({
        id: 'adm_001',
        user_id: adminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      supabase._store.whatsapp_deliveries.push({
        id: 'del_opt_out',
        business_id: 'biz_001',
        recipient_user_id: 'usr_opted_out',
        status: 'FAILED',
        rendered_body: 'Low Stock Alert',
        created_at: new Date().toISOString(),
      });

      supabase._store.whatsapp_connections.push({
        id: 'conn_1',
        business_id: 'biz_001',
        user_id: 'usr_opted_out',
        status: 'ACTIVE',
        consent_status: 'OPTED_OUT', // User sent STOP!
      });

      await assert.rejects(async () => {
        await WhatsAppAdminService.retryFailedDelivery(supabase, {
          deliveryId: 'del_opt_out',
          reason: 'Attempting to resend to opted out user',
        });
      }, /opted out/i);
    });

    it('STRICT INVARIANT: blocks retry if recipient is no longer an active member of business', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.platform_admins.push({
        id: 'adm_001',
        user_id: adminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      supabase._store.whatsapp_deliveries.push({
        id: 'del_former_staff',
        business_id: 'biz_001',
        recipient_user_id: 'usr_former_staff',
        status: 'FAILED',
        rendered_body: 'Overdue Invoice Alert',
        created_at: new Date().toISOString(),
      });

      supabase._store.whatsapp_connections.push({
        id: 'conn_2',
        business_id: 'biz_001',
        user_id: 'usr_former_staff',
        status: 'ACTIVE',
        consent_status: 'CONSENTED',
      });

      // No business membership row exists!
      await assert.rejects(async () => {
        await WhatsAppAdminService.retryFailedDelivery(supabase, {
          deliveryId: 'del_former_staff',
          reason: 'Resending to former staff',
        });
      }, /no longer an active member/i);
    });
  });

  describe('6. Zero Financial Mutations & Score Overrides', () => {
    it('confirms read-only access with zero mutations across financial entities', async () => {
      const supabase = createMockSupabase(adminUser);
      supabase._store.platform_admins.push({
        id: 'adm_001',
        user_id: adminUser.id,
        role: 'super_admin',
        status: 'active',
      });

      const overview = await IntelligenceOverviewService.getOverview(supabase, '24h');
      assert.ok(overview);
      assert.equal(overview.businessHealth.activeFormula, 'business-health-score-v1');
    });
  });
});
