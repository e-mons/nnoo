import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@nnoo/supabase';
import type {
  AutomationType,
  AutomationFrequency,
  AutomationJobType,
  AutomationRunStatus,
  AutomationResultType,
  AutomationSkipReason,
  BusinessAutomation,
  IntelligenceJobRun,
  BusinessAttentionEvent,
  UpdateAutomationInput,
  RunAutomationNowResult,
} from '@nnoo/contracts';
import { AISafeError } from '../service';
import type { GeminiClientInterface } from '../gemini/client';
import { AIBusinessInsightService } from '../insights/insight-service';
import { BusinessHealthService } from '../health/health-service';
import { AttentionScannerService } from './attention-scanner';
import { buildScheduledIdempotencyKey, buildManualIdempotencyKey } from './idempotency';
import { resolveScheduledPeriod, computeNextRunAt } from './scheduler';
import { NotificationService } from '../notifications/notification-service';

export class AutomationService {
  /**
   * Retrieves all automation configurations for a business.
   * Returns defaults for any unconfigured automation types.
   */
  public static async getAutomations(
    supabase: SupabaseClient<Database>,
    businessId: string
  ): Promise<BusinessAutomation[]> {
    const { data: rows, error } = await supabase
      .from('business_automations')
      .select('*')
      .eq('business_id', businessId);

    if (error) {
      throw new AISafeError('AI_AUTOMATION_INVALID_INPUT', `Failed to load automations: ${error.message}`);
    }

    const typeList: AutomationType[] = ['business_summary', 'health_score_refresh', 'attention_scan'];
    const rowMap = new Map<AutomationType, (typeof rows)[0]>();

    for (const r of rows || []) {
      rowMap.set(r.automation_type as AutomationType, r);
    }

    return typeList.map((t) => {
      const existing = rowMap.get(t);
      if (existing) {
        return {
          id: existing.id,
          businessId: existing.business_id,
          automationType: existing.automation_type as AutomationType,
          enabled: existing.enabled,
          frequency: existing.frequency as AutomationFrequency,
          scheduleLocalTime: existing.schedule_local_time,
          scheduleWeekday: existing.schedule_weekday,
          scheduleMonthday: existing.schedule_monthday,
          configVersion: existing.config_version,
          createdByUserId: existing.created_by_user_id,
          updatedByUserId: existing.updated_by_user_id,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at,
        };
      }

      // Default representation
      return {
        id: `default-${t}`,
        businessId,
        automationType: t,
        enabled: false,
        frequency: 'off',
        scheduleLocalTime: '08:00',
        scheduleWeekday: t === 'business_summary' ? 1 : null,
        scheduleMonthday: null,
        configVersion: 1,
        createdByUserId: null,
        updatedByUserId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Updates or creates an automation configuration.
   */
  public static async updateAutomation(
    supabase: SupabaseClient<Database>,
    businessId: string,
    userId: string,
    input: UpdateAutomationInput
  ): Promise<BusinessAutomation> {
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('business_automations')
      .select('*')
      .eq('business_id', businessId)
      .eq('automation_type', input.automationType)
      .maybeSingle();

    const newVersion = existing ? existing.config_version + 1 : 1;
    const scheduleLocalTime = input.scheduleLocalTime || existing?.schedule_local_time || '08:00';
    const scheduleWeekday = input.frequency === 'weekly' ? input.scheduleWeekday ?? existing?.schedule_weekday ?? 1 : null;
    const scheduleMonthday = input.frequency === 'monthly' ? input.scheduleMonthday ?? existing?.schedule_monthday ?? 1 : null;

    if (existing) {
      const { data: updated, error } = await supabase
        .from('business_automations')
        .update({
          enabled: input.enabled,
          frequency: input.frequency,
          schedule_local_time: scheduleLocalTime,
          schedule_weekday: scheduleWeekday,
          schedule_monthday: scheduleMonthday,
          config_version: newVersion,
          updated_by_user_id: userId,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error || !updated) {
        throw new AISafeError('AI_AUTOMATION_INVALID_INPUT', `Failed to update automation: ${error?.message}`);
      }

      return {
        id: updated.id,
        businessId: updated.business_id,
        automationType: updated.automation_type as AutomationType,
        enabled: updated.enabled,
        frequency: updated.frequency as AutomationFrequency,
        scheduleLocalTime: updated.schedule_local_time,
        scheduleWeekday: updated.schedule_weekday,
        scheduleMonthday: updated.schedule_monthday,
        configVersion: updated.config_version,
        createdByUserId: updated.created_by_user_id,
        updatedByUserId: updated.updated_by_user_id,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };
    }

    const { data: created, error } = await supabase
      .from('business_automations')
      .insert({
        business_id: businessId,
        automation_type: input.automationType,
        enabled: input.enabled,
        frequency: input.frequency,
        schedule_local_time: scheduleLocalTime,
        schedule_weekday: scheduleWeekday,
        schedule_monthday: scheduleMonthday,
        config_version: 1,
        created_by_user_id: userId,
        updated_by_user_id: userId,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error || !created) {
      throw new AISafeError('AI_AUTOMATION_INVALID_INPUT', `Failed to create automation: ${error?.message}`);
    }

    return {
      id: created.id,
      businessId: created.business_id,
      automationType: created.automation_type as AutomationType,
      enabled: created.enabled,
      frequency: created.frequency as AutomationFrequency,
      scheduleLocalTime: created.schedule_local_time,
      scheduleWeekday: created.schedule_weekday,
      scheduleMonthday: created.schedule_monthday,
      configVersion: created.config_version,
      createdByUserId: created.created_by_user_id,
      updatedByUserId: created.updated_by_user_id,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    };
  }

  /**
   * Retrieves paginated job execution logs for a business.
   */
  public static async getRunHistory(
    supabase: SupabaseClient<Database>,
    businessId: string,
    limit = 50,
    offset = 0
  ): Promise<{ runs: IntelligenceJobRun[]; total: number }> {
    const { data: rows, error, count } = await supabase
      .from('intelligence_job_runs')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AISafeError('AI_AUTOMATION_INVALID_INPUT', `Failed to load job runs: ${error.message}`);
    }

    const runs: IntelligenceJobRun[] = (rows || []).map((r) => ({
      id: r.id,
      businessId: r.business_id,
      automationId: r.automation_id,
      jobType: r.job_type as AutomationJobType,
      idempotencyKey: r.idempotency_key,
      status: r.status as AutomationRunStatus,
      scheduledFor: r.scheduled_for,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      attemptCount: r.attempt_count,
      sourceFingerprint: r.source_fingerprint,
      resultType: r.result_type as AutomationResultType | null,
      resultId: r.result_id,
      providerInvocationId: r.provider_invocation_id,
      errorCode: r.error_code,
      skipReason: r.skip_reason as AutomationSkipReason | null,
      correlationId: r.correlation_id,
      createdAt: r.created_at,
    }));

    return { runs, total: count ?? runs.length };
  }

  /**
   * Retrieves active or all attention events for a business.
   */
  public static async getAttentionEvents(
    supabase: SupabaseClient<Database>,
    businessId: string,
    status?: 'active' | 'resolved' | 'dismissed'
  ): Promise<BusinessAttentionEvent[]> {
    let query = supabase
      .from('business_attention_events')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: rows, error } = await query;
    if (error) {
      throw new AISafeError('AI_AUTOMATION_INVALID_INPUT', `Failed to load attention events: ${error.message}`);
    }

    return (rows || []).map((r) => ({
      id: r.id,
      businessId: r.business_id,
      type: r.type as any,
      category: r.category as any,
      dedupeKey: r.dedupe_key,
      status: r.status as any,
      severity: r.severity as any,
      firstDetectedAt: r.first_detected_at,
      lastDetectedAt: r.last_detected_at,
      resolvedAt: r.resolved_at,
      sourceType: r.source_type,
      sourceReference: r.source_reference,
      metadata: (r.metadata || {}) as Record<string, unknown>,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  /**
   * Executes scheduled business summary with deduplication, fingerprint reuse, and safe skip conditions.
   * Skips Gemini provider calls when facts are unchanged (0 Gemini calls).
   */
  public static async executeScheduledSummary(
    supabase: SupabaseClient<Database>,
    businessId: string,
    scheduledPeriod?: string,
    expectedConfigVersion?: number,
    geminiClient?: GeminiClientInterface
  ): Promise<RunAutomationNowResult> {
    const period = scheduledPeriod || resolveScheduledPeriod(new Date(), 'daily');

    // 1. Recheck configuration at runtime
    const { data: config } = await supabase
      .from('business_automations')
      .select('*')
      .eq('business_id', businessId)
      .eq('automation_type', 'business_summary')
      .maybeSingle();

    if (!config || !config.enabled || config.frequency === 'off') {
      const idempotencyKey = buildScheduledIdempotencyKey(businessId, 'business_summary', period, expectedConfigVersion || 1);
      const run = await this.recordSkippedRun(supabase, {
        businessId,
        automationId: config?.id || null,
        jobType: 'scheduled_business_summary',
        idempotencyKey,
        skipReason: 'AUTOMATION_DISABLED',
      });
      return { jobRunId: run.id, status: 'skipped', resultType: 'skipped', resultId: null, skipReason: 'AUTOMATION_DISABLED' };
    }

    if (expectedConfigVersion && config.config_version !== expectedConfigVersion) {
      const idempotencyKey = buildScheduledIdempotencyKey(businessId, 'business_summary', period, expectedConfigVersion);
      const run = await this.recordSkippedRun(supabase, {
        businessId,
        automationId: config.id,
        jobType: 'scheduled_business_summary',
        idempotencyKey,
        skipReason: 'STALE_SCHEDULE_VERSION',
      });
      return { jobRunId: run.id, status: 'skipped', resultType: 'skipped', resultId: null, skipReason: 'STALE_SCHEDULE_VERSION' };
    }

    const idempotencyKey = buildScheduledIdempotencyKey(businessId, 'business_summary', period, config.config_version);

    // Check for existing run with this idempotency key
    const { data: existingRun } = await supabase
      .from('intelligence_job_runs')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingRun && (existingRun.status === 'succeeded' || existingRun.status === 'skipped')) {
      return {
        jobRunId: existingRun.id,
        status: existingRun.status as AutomationRunStatus,
        resultType: existingRun.result_type as AutomationResultType | null,
        resultId: existingRun.result_id,
        skipReason: existingRun.skip_reason as AutomationSkipReason | null,
        isReused: true,
      };
    }

    // Record running job
    const runId = await this.recordJobStart(supabase, {
      businessId,
      automationId: config.id,
      jobType: 'scheduled_business_summary',
      idempotencyKey,
    });

    try {
      // Determine summary period type
      const summaryType = config.frequency === 'weekly' ? 'this_week' : config.frequency === 'monthly' ? 'this_month' : 'today';

      // 2. Fetch facts and check if fresh summary already exists (0 Gemini calls if unchanged)
      const factsResult = await AIBusinessInsightService.getVerifiedFacts({
        supabase,
        businessId,
        userId: config.created_by_user_id || 'system-automation',
        userRole: 'owner',
        summaryType,
      });

      if (factsResult.isFresh && factsResult.latestSummary) {
        // Reuse existing summary — 0 Gemini calls!
        await supabase
          .from('intelligence_job_runs')
          .update({
            status: 'succeeded',
            completed_at: new Date().toISOString(),
            result_type: 'summary_reused',
            result_id: factsResult.latestSummary.id,
            source_fingerprint: AIBusinessInsightService.computeSourceFingerprint(factsResult.bundle),
          })
          .eq('id', runId);

        return {
          jobRunId: runId,
          status: 'succeeded',
          resultType: 'summary_reused',
          resultId: factsResult.latestSummary.id,
          skipReason: null,
          isReused: true,
        };
      }

      // Generate new summary via Gemini
      const newSummary = await AIBusinessInsightService.generateSummary({
        supabase,
        businessId,
        userId: config.created_by_user_id || 'system-automation',
        userRole: 'owner',
        summaryType,
        idempotencyKey: `auto-${idempotencyKey}`,
        geminiClient,
      });

      await supabase
        .from('intelligence_job_runs')
        .update({
          status: 'succeeded',
          completed_at: new Date().toISOString(),
          result_type: 'summary_created',
          result_id: newSummary.id,
          source_fingerprint: newSummary.sourceFingerprint,
        })
        .eq('id', runId);

      // Fan out notifications to eligible members
      await NotificationService.processJobRunEvent(supabase, {
        id: runId,
        business_id: businessId,
        job_type: 'business_summary',
        status: 'succeeded',
        result_id: newSummary.id,
      }).catch(() => null);

      return {
        jobRunId: runId,
        status: 'succeeded',
        resultType: 'summary_created',
        resultId: newSummary.id,
        skipReason: null,
      };
    } catch (err: any) {
      await supabase
        .from('intelligence_job_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_code: err?.code || err?.message || 'UNKNOWN_AUTOMATION_ERROR',
        })
        .eq('id', runId);

      throw err;
    }
  }

  /**
   * Executes scheduled deterministic health score refresh (0 Gemini calls).
   */
  public static async executeScheduledHealth(
    supabase: SupabaseClient<Database>,
    businessId: string,
    scheduledPeriod?: string,
    expectedConfigVersion?: number
  ): Promise<RunAutomationNowResult> {
    const period = scheduledPeriod || resolveScheduledPeriod(new Date(), 'daily');

    // 1. Recheck configuration at runtime
    const { data: config } = await supabase
      .from('business_automations')
      .select('*')
      .eq('business_id', businessId)
      .eq('automation_type', 'health_score_refresh')
      .maybeSingle();

    if (!config || !config.enabled || config.frequency === 'off') {
      const idempotencyKey = buildScheduledIdempotencyKey(businessId, 'health_score_refresh', period, expectedConfigVersion || 1);
      const run = await this.recordSkippedRun(supabase, {
        businessId,
        automationId: config?.id || null,
        jobType: 'scheduled_health_refresh',
        idempotencyKey,
        skipReason: 'AUTOMATION_DISABLED',
      });
      return { jobRunId: run.id, status: 'skipped', resultType: 'skipped', resultId: null, skipReason: 'AUTOMATION_DISABLED' };
    }

    const idempotencyKey = buildScheduledIdempotencyKey(businessId, 'health_score_refresh', period, config.config_version);

    // Check for existing run
    const { data: existingRun } = await supabase
      .from('intelligence_job_runs')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingRun && (existingRun.status === 'succeeded' || existingRun.status === 'skipped')) {
      return {
        jobRunId: existingRun.id,
        status: existingRun.status as AutomationRunStatus,
        resultType: existingRun.result_type as AutomationResultType | null,
        resultId: existingRun.result_id,
        skipReason: existingRun.skip_reason as AutomationSkipReason | null,
        isReused: true,
      };
    }

    const runId = await this.recordJobStart(supabase, {
      businessId,
      automationId: config.id,
      jobType: 'scheduled_health_refresh',
      idempotencyKey,
    });

    try {
      // Deterministic health calculation (0 Gemini calls)
      const healthResult = await BusinessHealthService.refreshScore({
        supabase,
        businessId,
        userId: config.created_by_user_id || 'system-automation',
        userRole: 'owner',
      });

      const resultType: AutomationResultType = 'health_snapshot_created';

      await supabase
        .from('intelligence_job_runs')
        .update({
          status: 'succeeded',
          completed_at: new Date().toISOString(),
          result_type: resultType,
          result_id: healthResult.id || null,
          source_fingerprint: healthResult.sourceFingerprint,
        })
        .eq('id', runId);

      return {
        jobRunId: runId,
        status: 'succeeded',
        resultType,
        resultId: healthResult.id || null,
        skipReason: null,
      };
    } catch (err: any) {
      await supabase
        .from('intelligence_job_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_code: err?.code || err?.message || 'UNKNOWN_AUTOMATION_ERROR',
        })
        .eq('id', runId);

      throw err;
    }
  }

  /**
   * Executes scheduled deterministic attention condition scan (0 Gemini calls).
   */
  public static async executeAttentionScan(
    supabase: SupabaseClient<Database>,
    businessId: string,
    scheduledPeriod?: string,
    expectedConfigVersion?: number
  ): Promise<RunAutomationNowResult> {
    const period = scheduledPeriod || resolveScheduledPeriod(new Date(), 'daily');

    const { data: config } = await supabase
      .from('business_automations')
      .select('*')
      .eq('business_id', businessId)
      .eq('automation_type', 'attention_scan')
      .maybeSingle();

    if (!config || !config.enabled || config.frequency === 'off') {
      const idempotencyKey = buildScheduledIdempotencyKey(businessId, 'attention_scan', period, expectedConfigVersion || 1);
      const run = await this.recordSkippedRun(supabase, {
        businessId,
        automationId: config?.id || null,
        jobType: 'scheduled_attention_scan',
        idempotencyKey,
        skipReason: 'AUTOMATION_DISABLED',
      });
      return { jobRunId: run.id, status: 'skipped', resultType: 'skipped', resultId: null, skipReason: 'AUTOMATION_DISABLED' };
    }

    const idempotencyKey = buildScheduledIdempotencyKey(businessId, 'attention_scan', period, config.config_version);

    const { data: existingRun } = await supabase
      .from('intelligence_job_runs')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingRun && (existingRun.status === 'succeeded' || existingRun.status === 'skipped')) {
      return {
        jobRunId: existingRun.id,
        status: existingRun.status as AutomationRunStatus,
        resultType: existingRun.result_type as AutomationResultType | null,
        resultId: existingRun.result_id,
        skipReason: existingRun.skip_reason as AutomationSkipReason | null,
        isReused: true,
      };
    }

    const runId = await this.recordJobStart(supabase, {
      businessId,
      automationId: config.id,
      jobType: 'scheduled_attention_scan',
      idempotencyKey,
    });

    try {
      const scanner = new AttentionScannerService(supabase);
      const scanSummary = await scanner.scanBusiness(businessId);

      await supabase
        .from('intelligence_job_runs')
        .update({
          status: 'succeeded',
          completed_at: new Date().toISOString(),
          result_type: 'attention_scan_completed',
          result_id: `${scanSummary.detectedCount} detected, ${scanSummary.resolvedCount} resolved`,
        })
        .eq('id', runId);

      // Fan out notifications for active attention events
      for (const event of scanSummary.activeEvents) {
        await NotificationService.processAttentionEvent(supabase, {
          id: event.id,
          business_id: businessId,
          type: event.type,
          category: event.category,
          severity: event.severity,
          dedupe_key: event.dedupeKey,
          source_type: event.sourceType,
          source_reference: event.sourceReference,
          metadata: event.metadata,
        }).catch(() => null);
      }

      return {
        jobRunId: runId,
        status: 'succeeded',
        resultType: 'attention_scan_completed',
        resultId: `${scanSummary.detectedCount} detected, ${scanSummary.resolvedCount} resolved`,
        skipReason: null,
      };
    } catch (err: any) {
      await supabase
        .from('intelligence_job_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_code: err?.code || err?.message || 'UNKNOWN_AUTOMATION_ERROR',
        })
        .eq('id', runId);

      throw err;
    }
  }

  /**
   * Executes on-demand manual automation run.
   */
  public static async runNow(
    supabase: SupabaseClient<Database>,
    businessId: string,
    userId: string,
    userRole: string,
    automationType: AutomationType,
    customKey?: string,
    geminiClient?: GeminiClientInterface
  ): Promise<RunAutomationNowResult> {
    if (!['owner', 'business_admin', 'manager', 'accountant'].includes(userRole)) {
      throw new AISafeError('AI_AUTOMATION_FORBIDDEN', 'Insufficient permissions to trigger automations');
    }

    const idempotencyKey = buildManualIdempotencyKey(businessId, automationType, customKey);

    // Look up automation config if it exists
    const { data: config } = await supabase
      .from('business_automations')
      .select('*')
      .eq('business_id', businessId)
      .eq('automation_type', automationType)
      .maybeSingle();

    const jobTypeMap: Record<AutomationType, AutomationJobType> = {
      business_summary: 'manual_business_summary',
      health_score_refresh: 'manual_health_refresh',
      attention_scan: 'manual_attention_scan',
    };

    const runId = await this.recordJobStart(supabase, {
      businessId,
      automationId: config?.id || null,
      jobType: jobTypeMap[automationType],
      idempotencyKey,
    });

    try {
      if (automationType === 'business_summary') {
        const summary = await AIBusinessInsightService.generateSummary({
          supabase,
          businessId,
          userId,
          userRole,
          summaryType: 'today',
          idempotencyKey: `man-${idempotencyKey}`,
          geminiClient,
        });

        await supabase
          .from('intelligence_job_runs')
          .update({
            status: 'succeeded',
            completed_at: new Date().toISOString(),
            result_type: 'summary_created',
            result_id: summary.id,
            source_fingerprint: summary.sourceFingerprint,
          })
          .eq('id', runId);

        return {
          jobRunId: runId,
          status: 'succeeded',
          resultType: 'summary_created',
          resultId: summary.id,
          skipReason: null,
        };
      }

      if (automationType === 'health_score_refresh') {
        const healthResult = await BusinessHealthService.refreshScore({
          supabase,
          businessId,
          userId,
          userRole,
        });

        const resultType: AutomationResultType = 'health_snapshot_created';

        await supabase
          .from('intelligence_job_runs')
          .update({
            status: 'succeeded',
            completed_at: new Date().toISOString(),
            result_type: resultType,
            result_id: healthResult.id || null,
            source_fingerprint: healthResult.sourceFingerprint,
          })
          .eq('id', runId);

        return {
          jobRunId: runId,
          status: 'succeeded',
          resultType,
          resultId: healthResult.id || null,
          skipReason: null,
        };
      }

      if (automationType === 'attention_scan') {
        const scanner = new AttentionScannerService(supabase);
        const scanSummary = await scanner.scanBusiness(businessId);

        await supabase
          .from('intelligence_job_runs')
          .update({
            status: 'succeeded',
            completed_at: new Date().toISOString(),
            result_type: 'attention_scan_completed',
            result_id: `${scanSummary.detectedCount} detected, ${scanSummary.resolvedCount} resolved`,
          })
          .eq('id', runId);

        return {
          jobRunId: runId,
          status: 'succeeded',
          resultType: 'attention_scan_completed',
          resultId: `${scanSummary.detectedCount} detected, ${scanSummary.resolvedCount} resolved`,
          skipReason: null,
        };
      }

      throw new AISafeError('AI_AUTOMATION_INVALID_INPUT', `Unknown automation type: ${automationType}`);
    } catch (err: any) {
      await supabase
        .from('intelligence_job_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_code: err?.code || err?.message || 'UNKNOWN_AUTOMATION_ERROR',
        })
        .eq('id', runId);

      throw err;
    }
  }

  /**
   * Records initial job start.
   */
  private static async recordJobStart(
    supabase: SupabaseClient<Database>,
    params: {
      businessId: string;
      automationId: string | null;
      jobType: AutomationJobType;
      idempotencyKey: string;
    }
  ): Promise<string> {
    const { data, error } = await supabase
      .from('intelligence_job_runs')
      .insert({
        business_id: params.businessId,
        automation_id: params.automationId,
        job_type: params.jobType,
        idempotency_key: params.idempotencyKey,
        status: 'running',
        started_at: new Date().toISOString(),
        attempt_count: 1,
      })
      .select('id')
      .single();

    if (error || !data) {
      // If conflict on idempotency key, query existing
      const { data: existing } = await supabase
        .from('intelligence_job_runs')
        .select('id')
        .eq('idempotency_key', params.idempotencyKey)
        .single();

      if (existing) return existing.id;
      throw new AISafeError('AI_AUTOMATION_IDEMPOTENCY_CONFLICT', `Failed to initialize job run: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Records a skipped job run.
   */
  private static async recordSkippedRun(
    supabase: SupabaseClient<Database>,
    params: {
      businessId: string;
      automationId: string | null;
      jobType: AutomationJobType;
      idempotencyKey: string;
      skipReason: AutomationSkipReason;
    }
  ): Promise<{ id: string }> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('intelligence_job_runs')
      .upsert(
        {
          business_id: params.businessId,
          automation_id: params.automationId,
          job_type: params.jobType,
          idempotency_key: params.idempotencyKey,
          status: 'skipped',
          started_at: now,
          completed_at: now,
          skip_reason: params.skipReason,
          result_type: 'skipped',
          attempt_count: 1,
        },
        { onConflict: 'idempotency_key' }
      )
      .select('id')
      .single();

    if (error || !data) {
      return { id: 'skipped-run' };
    }

    return { id: data.id };
  }
}
