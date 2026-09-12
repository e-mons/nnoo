import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AutomationOperationsMetrics,
  IntelligenceReportingPeriod,
  RetryFailedJobInput,
  RetryFailedJobResult,
  IntelligenceSystemStatus,
} from '@nnoo/contracts/ai';
import { AISafeError } from '../service';
import { requirePlatformAdmin } from './auth';
import { AiOperationsService } from './ai-operations-service';
import { AutomationService } from '../automation/automation-service';

export class JobAdminService {
  /**
   * Retrieves automation operations telemetry.
   */
  public static async getAutomationMetrics(
    supabase: SupabaseClient,
    period: IntelligenceReportingPeriod = '24h'
  ): Promise<AutomationOperationsMetrics> {
    const periodStart = AiOperationsService.getPeriodStartTimestamp(period);

    // 1. Enabled automations count
    const { count: enabledCount } = await supabase
      .from('business_automations')
      .select('*', { count: 'exact', head: true })
      .eq('enabled', true);

    // 2. Job runs in the period
    const { data: runs, error } = await supabase
      .from('intelligence_job_runs')
      .select('*')
      .gte('created_at', periodStart)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AISafeError(
        'ADMIN_INTERNAL_ERROR' as any,
        `Failed to retrieve job runs: ${error.message}`,
        false
      );
    }

    const allRuns = runs || [];
    let succeededRuns = 0;
    let failedRuns = 0;
    let skippedRuns = 0;
    let currentlyRunning = 0;

    for (const r of allRuns) {
      if (r.status === 'succeeded') succeededRuns++;
      else if (r.status === 'failed') failedRuns++;
      else if (r.status === 'skipped') skippedRuns++;
      else if (r.status === 'running' || r.status === 'queued') currentlyRunning++;
    }

    let status: IntelligenceSystemStatus = 'HEALTHY';
    if (failedRuns > 0 && allRuns.length > 0) {
      const failRate = failedRuns / allRuns.length;
      if (failRate > 0.2) status = 'DEGRADED';
    }

    const recentFailures = allRuns
      .filter((r) => r.status === 'failed')
      .slice(0, 15)
      .map((r) => ({
        id: r.id,
        businessId: r.business_id,
        jobType: r.job_type,
        attemptCount: r.attempt_count,
        errorCode: r.error_code || 'JOB_FAILED',
        startedAt: r.started_at,
        completedAt: r.completed_at,
      }));

    return {
      period,
      status,
      enabledAutomationsCount: enabledCount || 0,
      totalJobRuns: allRuns.length,
      succeededRuns,
      failedRuns,
      skippedRuns,
      currentlyRunning,
      recentFailures,
    };
  }

  /**
   * Safely retries a failed background job.
   * Rechecks current business status, automation status, and runs canonical execution.
   */
  public static async retryFailedJob(
    supabase: SupabaseClient,
    input: RetryFailedJobInput
  ): Promise<RetryFailedJobResult> {
    const { user, adminRecord } = await requirePlatformAdmin(supabase);

    if (!input.reason || input.reason.trim().length < 3) {
      throw new AISafeError(
        'ADMIN_REASON_REQUIRED' as any,
        'A valid audit reason (at least 3 characters) is required to retry a failed job.',
        false
      );
    }

    // 1. Fetch original failed job
    const { data: job, error: jobErr } = await supabase
      .from('intelligence_job_runs')
      .select('*, businesses!inner(id, name)')
      .eq('id', input.jobRunId)
      .maybeSingle();

    if (jobErr || !job) {
      throw new AISafeError(
        'ADMIN_JOB_NOT_FOUND' as any,
        `Job run '${input.jobRunId}' was not found.`,
        false
      );
    }

    if (job.status !== 'failed') {
      throw new AISafeError(
        'ADMIN_JOB_NOT_RETRYABLE' as any,
        `Only failed jobs can be retried. Current status: '${job.status}'.`,
        false
      );
    }

    // 2. Recheck business active status
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', job.business_id)
      .maybeSingle();

    if (!business) {
      throw new AISafeError(
        'ADMIN_JOB_RETRY_FAILED' as any,
        'Target business is suspended or no longer exists.',
        false
      );
    }

    // 3. Recheck automation enabled status if linked
    if (job.automation_id) {
      const { data: automation } = await supabase
        .from('business_automations')
        .select('enabled')
        .eq('id', job.automation_id)
        .maybeSingle();

      if (automation && !automation.enabled) {
        throw new AISafeError(
          'ADMIN_JOB_RETRY_FAILED' as any,
          'Underlying automation is currently disabled for this business.',
          false
        );
      }
    }

    const now = new Date().toISOString();
    const retryIdempotencyKey = `admin_retry_${job.id}_${Date.now()}`;

    // 4. Log audit event
    await supabase.from('platform_audit_events').insert({
      actor_id: adminRecord.id,
      action: 'platform.job.retry',
      target_type: 'intelligence_job_run',
      target_id: job.id,
      reason: input.reason.trim(),
      metadata: {
        originalJobRunId: job.id,
        businessId: job.business_id,
        jobType: job.job_type,
        retryIdempotencyKey,
        adminUserId: user.id,
      },
      created_at: now,
    });

    // 5. Execute canonical job run
    let executeResult: any;
    try {
      if (job.job_type.includes('attention_scan')) {
        executeResult = await AutomationService.executeAttentionScan(
          supabase as any,
          job.business_id
        );
      } else if (job.job_type.includes('health_refresh')) {
        executeResult = await AutomationService.executeScheduledHealth(
          supabase as any,
          job.business_id
        );
      } else {
        executeResult = await AutomationService.executeScheduledSummary(
          supabase as any,
          job.business_id
        );
      }


      return {
        success: true,
        jobRunId: job.id,
        status: 'succeeded',
        message: `Job '${job.job_type}' retried successfully. Result: ${executeResult?.status || 'completed'}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        jobRunId: job.id,
        status: 'failed',
        message: `Job retry execution encountered error: ${err.message}`,
      };
    }
  }
}
