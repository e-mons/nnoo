import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IntelligenceAdminOverview,
  IntelligenceReportingPeriod,
  BookkeeperOperationsMetrics,
  AskNnooOperationsMetrics,
  HealthOperationsMetrics,
  CreditPassportOperationsMetrics,
  NotificationOperationsMetrics,
  IntelligenceSystemStatus,
} from '@nnoo/contracts/ai';
import { AiOperationsService } from './ai-operations-service';
import { JobAdminService } from './job-admin-service';
import { WhatsAppAdminService } from './whatsapp-admin-service';

export class IntelligenceOverviewService {

  /**
   * Retrieves high-level Intelligence Operations Center overview.
   * Runs deterministically with ZERO Gemini API provider calls.
   */
  public static async getOverview(
    supabase: SupabaseClient,
    period: IntelligenceReportingPeriod = '24h'
  ): Promise<IntelligenceAdminOverview> {
    const periodStart = AiOperationsService.getPeriodStartTimestamp(period);

    // 1. AI Operations & Provider status
    const aiMetrics = await AiOperationsService.getOperationsMetrics(supabase, period);

    // 2. AI Bookkeeper telemetry
    const { count: totalClassifications } = await supabase
      .from('ai_bookkeeping_classifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: pendingReviews } = await supabase
      .from('ai_bookkeeping_classifications')
      .select('*', { count: 'exact', head: true })
      .eq('classification_status', 'REQUIRES_HUMAN_REVIEW');

    const { count: validationFailures } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('feature_key', 'ai_bookkeeper')
      .eq('status', 'failed')
      .gte('created_at', periodStart);

    let bookkeeperStatus: IntelligenceSystemStatus = 'HEALTHY';
    if ((validationFailures || 0) > 5) bookkeeperStatus = 'DEGRADED';

    // 3. Ask NNOO telemetry
    const { count: totalAskRequests } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('feature_key', 'ask_nnoo')
      .gte('created_at', periodStart);

    const { count: askFailures } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('feature_key', 'ask_nnoo')
      .eq('status', 'failed')
      .gte('created_at', periodStart);

    let askNnooStatus: IntelligenceSystemStatus = 'HEALTHY';
    if ((askFailures || 0) > 5) askNnooStatus = 'DEGRADED';

    // 4. Business Health telemetry
    const { data: healthSnapshots } = await supabase
      .from('ai_business_health_snapshots')
      .select('status')
      .gte('created_at', periodStart);

    let totalCalculations = healthSnapshots?.length || 0;
    let readyCount = 0;
    let insufficientDataCount = 0;

    for (const h of healthSnapshots || []) {
      if (h.status === 'ready') readyCount++;
      else if (h.status === 'insufficient_data') insufficientDataCount++;
    }

    const { count: healthFailures } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('feature_key', 'health_explanation')
      .eq('status', 'failed')
      .gte('created_at', periodStart);

    // 5. Credit Passport telemetry
    const { count: totalPassports } = await supabase
      .from('credit_passport_snapshots')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: activeShares } = await supabase
      .from('credit_passport_shares')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: passportFailures } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('feature_key', 'credit_passport_explanation')
      .eq('status', 'failed')
      .gte('created_at', periodStart);

    // 6. Automations & Job runs
    const jobMetrics = await JobAdminService.getAutomationMetrics(supabase, period);

    // 7. Notifications telemetry
    const { count: inAppCreated } = await supabase
      .from('business_notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    // 8. WhatsApp operations
    const whatsappMetrics = await WhatsAppAdminService.getWhatsAppMetrics(supabase, period);

    return {
      period,
      generatedAt: new Date().toISOString(),
      aiPlatform: {
        status: aiMetrics.providerStatus.status,
        totalRequests: aiMetrics.totalInvocations,
        successful: aiMetrics.successfulInvocations,
        failed: aiMetrics.failedInvocations,
        model: aiMetrics.providerStatus.configuredModel,
      },
      bookkeeper: {
        status: bookkeeperStatus,
        totalClassifications: totalClassifications || 0,
        pendingReviews: pendingReviews || 0,
        validationFailures: validationFailures || 0,
      },
      askNnoo: {
        status: askNnooStatus,
        totalRequests: totalAskRequests || 0,
        validationFailures: askFailures || 0,
      },
      businessHealth: {
        status: 'HEALTHY',
        activeFormula: 'business-health-score-v1',
        totalCalculations,
        insufficientData: insufficientDataCount,
        failures: healthFailures || 0,
      },
      creditPassport: {
        status: 'HEALTHY',
        totalGenerated: totalPassports || 0,
        generationFailures: passportFailures || 0,
        activeShares: activeShares || 0,
      },
      automations: {
        status: jobMetrics.status,
        succeeded: jobMetrics.succeededRuns,
        failed: jobMetrics.failedRuns,
        skipped: jobMetrics.skippedRuns,
      },
      notifications: {
        status: 'HEALTHY',
        inAppCreated: inAppCreated || 0,
        deduplicated: 0,
        preferenceSkipped: 0,
      },
      whatsapp: {
        status: whatsappMetrics.status,
        activeConnections: whatsappMetrics.activeConnectionsCount,
        sent: whatsappMetrics.messagesSent,
        delivered: whatsappMetrics.messagesDelivered,
        failed: whatsappMetrics.messagesFailed,
      },
    };
  }

  /**
   * Retrieves detailed Bookkeeper operations metrics.
   */
  public static async getBookkeeperMetrics(
    supabase: SupabaseClient,
    period: IntelligenceReportingPeriod = '24h'
  ): Promise<BookkeeperOperationsMetrics> {
    const periodStart = AiOperationsService.getPeriodStartTimestamp(period);

    const { data: classifications } = await supabase
      .from('ai_bookkeeping_classifications')
      .select('*')
      .gte('created_at', periodStart)
      .order('created_at', { ascending: false });

    const all = classifications || [];
    let validClassifications = 0;
    let lowConfidenceCount = 0;
    let pendingReviewsCount = 0;

    for (const c of all) {
      if (c.classification_status === 'VALID' || c.classification_status === 'REQUIRES_HUMAN_REVIEW') {
        validClassifications++;
      }
      if (c.confidence_band === 'LOW') {
        lowConfidenceCount++;
      }
      if (c.classification_status === 'REQUIRES_HUMAN_REVIEW') {
        pendingReviewsCount++;
      }
    }

    const { count: appliedCount } = await supabase
      .from('ai_bookkeeping_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'applied')
      .gte('applied_at', periodStart);

    const { count: rejectedCount } = await supabase
      .from('ai_bookkeeping_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('review_action', 'REJECTED')
      .gte('created_at', periodStart);

    const { count: validationFailures } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('feature_key', 'ai_bookkeeper')
      .eq('status', 'failed')
      .gte('created_at', periodStart);

    let status: IntelligenceSystemStatus = 'HEALTHY';
    if ((validationFailures || 0) > 5) status = 'DEGRADED';

    return {
      period,
      status,
      totalClassifications: all.length,
      validClassifications,
      validationFailures: validationFailures || 0,
      lowConfidenceCount,
      pendingReviewsCount,
      confirmedApplicationsCount: appliedCount || 0,
      rejectedReviewsCount: rejectedCount || 0,
      lastClassificationAt: all[0]?.created_at || null,
    };
  }

  /**
   * Retrieves detailed Ask NNOO operations metrics.
   */
  public static async getAskNnooMetrics(
    supabase: SupabaseClient,
    period: IntelligenceReportingPeriod = '24h'
  ): Promise<AskNnooOperationsMetrics> {
    const periodStart = AiOperationsService.getPeriodStartTimestamp(period);

    const { count: totalConversations } = await supabase
      .from('ai_conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { data: invocations } = await supabase
      .from('ai_invocations')
      .select('*')
      .eq('feature_key', 'ask_nnoo')
      .gte('created_at', periodStart);

    const all = invocations || [];
    let successfulResponses = 0;
    let validationFailures = 0;
    let providerFailures = 0;
    let rateLimitedRequests = 0;

    for (const inv of all) {
      if (inv.status === 'succeeded') successfulResponses++;
      else if (inv.status === 'failed') validationFailures++;
      else if (inv.status === 'timeout' || inv.status === 'blocked') providerFailures++;
      else if (inv.status === 'rate_limited') rateLimitedRequests++;
    }

    let status: IntelligenceSystemStatus = 'HEALTHY';
    if (all.length > 0 && (validationFailures + providerFailures) / all.length > 0.25) {
      status = 'DEGRADED';
    }

    return {
      period,
      status,
      totalConversations: totalConversations || 0,
      totalRequests: all.length,
      successfulResponses,
      validationFailures,
      providerFailures,
      rateLimitedRequests,
      toolInvocations: [
        { toolKey: 'getBusinessOverview', count: 0, successCount: 0, failureCount: 0 },
        { toolKey: 'getSalesSummary', count: 0, successCount: 0, failureCount: 0 },
        { toolKey: 'getProfitabilitySummary', count: 0, successCount: 0, failureCount: 0 },
        { toolKey: 'getExpenseSummary', count: 0, successCount: 0, failureCount: 0 },
        { toolKey: 'getInventoryStatus', count: 0, successCount: 0, failureCount: 0 },
        { toolKey: 'lookupCustomer', count: 0, successCount: 0, failureCount: 0 },
      ],
    };
  }

  /**
   * Retrieves detailed Business Health operations metrics.
   */
  public static async getHealthMetrics(
    supabase: SupabaseClient,
    period: IntelligenceReportingPeriod = '24h'
  ): Promise<HealthOperationsMetrics> {
    const periodStart = AiOperationsService.getPeriodStartTimestamp(period);

    const { data: snapshots } = await supabase
      .from('ai_business_health_snapshots')
      .select('status, formula_version')
      .gte('created_at', periodStart);

    let readyCount = 0;
    let insufficientDataCount = 0;

    for (const s of snapshots || []) {
      if (s.status === 'ready') readyCount++;
      else if (s.status === 'insufficient_data') insufficientDataCount++;
    }

    const { count: calculationFailures } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('feature_key', 'health_explanation')
      .eq('status', 'failed')
      .gte('created_at', periodStart);

    return {
      period,
      status: 'HEALTHY',
      activeFormulaVersion: 'business-health-score-v1',
      totalCalculations: snapshots?.length || 0,
      readyCount,
      insufficientDataCount,
      calculationFailures: calculationFailures || 0,
      formulaRegistry: [
        {
          version: 'business-health-score-v1',
          status: 'ACTIVE',
          introducedAt: '2026-08-18T00:00:00Z',
          dimensionCount: 5,
        },
      ],
    };
  }

  /**
   * Retrieves detailed Credit Passport operations metrics.
   */
  public static async getCreditPassportMetrics(
    supabase: SupabaseClient,
    period: IntelligenceReportingPeriod = '24h'
  ): Promise<CreditPassportOperationsMetrics> {
    const periodStart = AiOperationsService.getPeriodStartTimestamp(period);

    const { count: totalGenerated } = await supabase
      .from('credit_passport_snapshots')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: generationFailures } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('feature_key', 'credit_passport_explanation')
      .eq('status', 'failed')
      .gte('created_at', periodStart);

    const { count: activeShares } = await supabase
      .from('credit_passport_shares')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: expiredShares } = await supabase
      .from('credit_passport_shares')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');

    const { count: revokedShares } = await supabase
      .from('credit_passport_shares')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'revoked');

    return {
      period,
      status: 'HEALTHY',
      totalGenerated: totalGenerated || 0,
      generationFailures: generationFailures || 0,
      pdfFailures: 0,
      activeSharesCount: activeShares || 0,
      expiredSharesCount: expiredShares || 0,
      revokedSharesCount: revokedShares || 0,
      integrityVerificationFailures: 0,
    };
  }

  /**
   * Retrieves detailed Notification operations metrics.
   */
  public static async getNotificationMetrics(
    supabase: SupabaseClient,
    period: IntelligenceReportingPeriod = '24h'
  ): Promise<NotificationOperationsMetrics> {
    const periodStart = AiOperationsService.getPeriodStartTimestamp(period);

    const { count: inAppCreated } = await supabase
      .from('business_notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    const { count: attentionEvents } = await supabase
      .from('business_attention_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart);

    return {
      period,
      status: 'HEALTHY',
      sourceEventsProcessed: attentionEvents || 0,
      inAppNotificationsCreated: inAppCreated || 0,
      deduplicatedCount: 0,
      permissionSkippedCount: 0,
      preferenceSkippedCount: 0,
      processingFailures: 0,
    };
  }
}
