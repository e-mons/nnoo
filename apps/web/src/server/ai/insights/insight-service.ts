import 'server-only';
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BusinessSummaryType,
  BusinessSummaryDetail,
  BusinessSummaryHistoryItem,
  BusinessInsightSignal,
  BusinessInsightActionKey,
  BusinessInsightSignalKey,
  BusinessSummaryStatus,
  VerifiedFactBundle,
  StructuredBusinessSummaryResponse,
} from '@nnoo/contracts';
import { StructuredBusinessSummaryResponseSchema } from '@nnoo/validation';
import { AIApplicationService, AISafeError, type GeminiClientInterface } from '../index';
import { BusinessPeriodResolver } from './period-resolver';
import { VerifiedFactBuilderService } from './fact-builder';
import { DeterministicInsightSignalEngine } from './signal-engine';
import { NumericLiteralGuard } from './numeric-guard';

export interface GetFactsOptions {
  supabase: SupabaseClient;
  businessId: string;
  userId: string;
  userRole: string;
  summaryType: BusinessSummaryType;
  startDate?: string;
  endDate?: string;
}

export interface GenerateSummaryOptions extends GetFactsOptions {
  idempotencyKey: string;
  geminiClient?: GeminiClientInterface;
}

export interface FactsResult {
  bundle: VerifiedFactBundle;
  signals: BusinessInsightSignal[];
  allowableActions: BusinessInsightActionKey[];
  latestSummary?: BusinessSummaryDetail | null;
  isFresh: boolean;
}

interface SummaryDbRow {
  id: string;
  business_id: string;
  requested_by_user_id: string;
  summary_type: string;
  period_start: string;
  period_end: string;
  as_of_timestamp: string;
  business_timezone: string;
  currency_code: string;
  source_fingerprint: string;
  permission_scope_fingerprint: string;
  headline: string;
  overview: string;
  selected_highlight_signal_keys: BusinessInsightSignalKey[];
  selected_attention_signal_keys: BusinessInsightSignalKey[];
  selected_action_keys: BusinessInsightActionKey[];
  verified_fact_snapshot: VerifiedFactBundle;
  prompt_version: string;
  model_id: string;
  status: string;
  created_at: string;
}

function mapRowToDetail(row: SummaryDbRow, isFresh: boolean): BusinessSummaryDetail {
  return {
    id: row.id,
    businessId: row.business_id,
    summaryType: row.summary_type as BusinessSummaryType,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    asOfTimestamp: row.as_of_timestamp,
    businessTimezone: row.business_timezone,
    currencyCode: row.currency_code,
    headline: row.headline,
    overview: row.overview,
    selectedHighlightSignalKeys: row.selected_highlight_signal_keys || [],
    selectedAttentionSignalKeys: row.selected_attention_signal_keys || [],
    selectedActionKeys: row.selected_action_keys || [],
    sourceFingerprint: row.source_fingerprint,
    permissionScopeFingerprint: row.permission_scope_fingerprint,
    verifiedFactSnapshot: row.verified_fact_snapshot,
    promptVersion: row.prompt_version,
    modelId: row.model_id,
    status: row.status as BusinessSummaryStatus,
    isFresh,
    createdAt: row.created_at,
  };
}

/**
 * Production Service for Verified Business Summaries & Smart Insights.
 * Coordinates reporting fact-building, deterministic signal generation,
 * Gemini structured narrative generation, deduplication, and persistence.
 */
export class AIBusinessInsightService {
  /**
   * Computes deterministic SHA-256 fingerprint of the verified fact bundle.
   */
  public static computeSourceFingerprint(bundle: VerifiedFactBundle): string {
    const materialData = {
      summaryType: bundle.summaryType,
      period: {
        start: bundle.period.start,
        end: bundle.period.end,
      },
      performance: bundle.performance,
      currentPosition: {
        accountsReceivableMinor: bundle.currentPosition.accountsReceivableMinor,
        accountsPayableMinor: bundle.currentPosition.accountsPayableMinor,
        inventoryValueMinor: bundle.currentPosition.inventoryValueMinor,
        lowStockCount: bundle.currentPosition.lowStockCount,
        outOfStockCount: bundle.currentPosition.outOfStockCount,
        overdueInvoicesCount: bundle.currentPosition.overdueInvoicesCount,
      },
    };
    return createHash('sha256').update(JSON.stringify(materialData)).digest('hex');
  }

  /**
   * Computes deterministic SHA-256 fingerprint of the user's permission scope.
   */
  public static computePermissionFingerprint(userRole: string, permittedKeys: string[]): string {
    return createHash('sha256')
      .update(JSON.stringify({ role: userRole, keys: permittedKeys.sort() }))
      .digest('hex');
  }

  /**
   * Retrieves real-time verified facts and signals with 0 Gemini API calls.
   */
  public static async getVerifiedFacts(options: GetFactsOptions): Promise<FactsResult> {
    const { supabase, businessId, userId, userRole, summaryType, startDate, endDate } = options;

    // 1. Resolve business timezone and period comparison
    const periodComparison = BusinessPeriodResolver.resolvePeriod(
      summaryType,
      'Africa/Lagos',
      startDate,
      endDate
    );

    // 2. Build verified fact bundle from canonical reporting RPCs
    const bundle = await VerifiedFactBuilderService.buildFactBundle({
      supabase,
      businessId,
      userRole,
      summaryType,
      currencyCode: 'NGN',
      timezone: 'Africa/Lagos',
      periodComparison,
    });

    // 3. Derive deterministic signals
    const { signals, allowableActions } = DeterministicInsightSignalEngine.deriveSignals(bundle);

    // 4. Retrieve latest summary if one exists
    const currentFingerprint = this.computeSourceFingerprint(bundle);
    const { data: summaryRow } = await supabase
      .from('ai_business_summaries')
      .select('*')
      .eq('business_id', businessId)
      .eq('requested_by_user_id', userId)
      .eq('summary_type', summaryType)
      .eq('period_start', periodComparison.current.start)
      .eq('period_end', periodComparison.current.end)
      .in('status', ['ready', 'failed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let latestSummary: BusinessSummaryDetail | null = null;
    let isFresh = false;

    if (summaryRow) {
      isFresh = summaryRow.source_fingerprint === currentFingerprint && summaryRow.status === 'ready';
      latestSummary = mapRowToDetail(summaryRow as SummaryDbRow, isFresh);
    }

    return {
      bundle,
      signals,
      allowableActions,
      latestSummary,
      isFresh,
    };
  }

  /**
   * Generates or retrieves an on-demand verified business summary.
   */
  public static async generateSummary(options: GenerateSummaryOptions): Promise<BusinessSummaryDetail> {
    const { supabase, businessId, userId, userRole, summaryType, geminiClient } = options;

    // 1. RBAC authorization preflight
    const isAuthorized = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isAuthorized) {
      throw new AISafeError(
        'AI_INSIGHTS_FORBIDDEN',
        `Role '${userRole}' is not permitted to generate business summaries.`,
        false
      );
    }

    // 2. Fetch facts and signals
    const { bundle, signals, allowableActions } = await this.getVerifiedFacts(options);

    // 3. Compute fingerprints
    const sourceFingerprint = this.computeSourceFingerprint(bundle);
    const permissionScopeFingerprint = this.computePermissionFingerprint(userRole, bundle.permittedFactKeys);

    // 4. Zero-data business check: return deterministic empty state without calling Gemini
    if (!bundle.hasSufficientData) {
      const emptyHeadline = 'No recorded business activity for this period';
      const emptyOverview =
        'There are no sales, operating expenses, or inventory movements recorded in this period. Once you record transactions in NNOO, verified summaries and smart insights will appear here.';

      const { data: savedEmpty, error: saveErr } = await supabase
        .from('ai_business_summaries')
        .insert({
          business_id: businessId,
          requested_by_user_id: userId,
          summary_type: summaryType,
          period_start: bundle.period.start,
          period_end: bundle.period.end,
          as_of_timestamp: new Date().toISOString(),
          business_timezone: bundle.timezone,
          currency_code: bundle.currencyCode,
          source_fact_schema_version: '1.0.0',
          source_fingerprint: sourceFingerprint,
          permission_scope_fingerprint: permissionScopeFingerprint,
          headline: emptyHeadline,
          overview: emptyOverview,
          selected_highlight_signal_keys: [],
          selected_attention_signal_keys: [],
          selected_action_keys: ['OPEN_SALES_REPORT', 'OPEN_EXPENSE_REPORT'],
          verified_fact_snapshot: bundle,
          prompt_version: '1.0.0',
          response_schema_version: '1.0.0',
          model_id: 'deterministic-rules',
          status: 'ready',
        })
        .select('*')
        .single();

      if (saveErr || !savedEmpty) {
        throw new AISafeError('AI_INSIGHTS_GENERATION_FAILED', `Failed to persist summary: ${saveErr?.message}`, true);
      }

      return mapRowToDetail(savedEmpty as SummaryDbRow, true);
    }

    // 5. Deduplication & Idempotency: Check if an active, matching summary already exists
    const { data: existingSummary } = await supabase
      .from('ai_business_summaries')
      .select('*')
      .eq('business_id', businessId)
      .eq('requested_by_user_id', userId)
      .eq('summary_type', summaryType)
      .eq('period_start', bundle.period.start)
      .eq('period_end', bundle.period.end)
      .eq('source_fingerprint', sourceFingerprint)
      .eq('permission_scope_fingerprint', permissionScopeFingerprint)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSummary) {
      return mapRowToDetail(existingSummary as SummaryDbRow, true);
    }

    // 6. Assemble context projection with data minimization
    const allowedSignalKeys = signals.map((s) => s.signalKey);
    const aiContextProjection = {
      period: bundle.period,
      comparison: bundle.comparison,
      performance: bundle.performance,
      previousPerformance: bundle.previousPerformance,
      currentPosition: bundle.currentPosition,
      availableSignals: signals.map((s) => ({
        signalKey: s.signalKey,
        type: s.type,
        direction: s.direction,
        title: s.title,
        changeDescription: s.changeDescription,
      })),
      allowableActions,
    };

    // 7. Execute structured summary via centralized AI Application Service
    const appService = new AIApplicationService(geminiClient);
    let narrative: StructuredBusinessSummaryResponse;
    try {
      narrative = await appService.executeFeature({
        featureKey: 'ai.summary.business',
        context: {
          businessId,
          userId,
          userRole,
        },
        userInput: `Generate verified business summary for ${bundle.period.label}.`,
        verifiedContext: aiContextProjection,
        responseSchema: StructuredBusinessSummaryResponseSchema,
        geminiClient,
      });
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string; retryable?: boolean };
      const code = (errorObj.code as any) || 'AI_INSIGHTS_GENERATION_FAILED';
      throw new AISafeError(code, errorObj.message || 'Failed to generate business summary narrative.', errorObj.retryable ?? true);
    }

    // 8. Validate output via NumericLiteralGuard
    NumericLiteralGuard.validate(narrative, allowedSignalKeys, allowableActions);

    // 9. Mark prior summaries for this period as superseded
    await supabase
      .from('ai_business_summaries')
      .update({ status: 'superseded' })
      .eq('business_id', businessId)
      .eq('requested_by_user_id', userId)
      .eq('summary_type', summaryType)
      .eq('period_start', bundle.period.start)
      .eq('period_end', bundle.period.end)
      .eq('status', 'ready');

    // 10. Persist validated summary
    const { data: savedRecord, error: insertErr } = await supabase
      .from('ai_business_summaries')
      .insert({
        business_id: businessId,
        requested_by_user_id: userId,
        summary_type: summaryType,
        period_start: bundle.period.start,
        period_end: bundle.period.end,
        as_of_timestamp: new Date().toISOString(),
        business_timezone: bundle.timezone,
        currency_code: bundle.currencyCode,
        source_fact_schema_version: '1.0.0',
        source_fingerprint: sourceFingerprint,
        permission_scope_fingerprint: permissionScopeFingerprint,
        headline: narrative.headline,
        overview: narrative.overview,
        selected_highlight_signal_keys: narrative.highlightSignalKeys,
        selected_attention_signal_keys: narrative.attentionSignalKeys,
        selected_action_keys: narrative.actionKeys,
        verified_fact_snapshot: bundle,
        prompt_version: '1.0.0',
        response_schema_version: '1.0.0',
        model_id: 'gemini-3.6-flash',
        ai_invocation_id: null,
        status: 'ready',
      })
      .select('*')
      .single();

    if (insertErr || !savedRecord) {
      throw new AISafeError('AI_INSIGHTS_GENERATION_FAILED', `Failed to persist summary: ${insertErr?.message}`, true);
    }

    return mapRowToDetail(savedRecord as SummaryDbRow, true);
  }

  /**
   * Retrieves summary history for the active business and user.
   */
  public static async getSummaryHistory(
    supabase: SupabaseClient,
    businessId: string,
    userId: string,
    limit: number = 20
  ): Promise<BusinessSummaryHistoryItem[]> {
    const { data, error } = await supabase
      .from('ai_business_summaries')
      .select('id, summary_type, period_start, period_end, headline, status, created_at')
      .eq('business_id', businessId)
      .eq('requested_by_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AISafeError('AI_INTERNAL_ERROR', `Failed to fetch summary history: ${error.message}`, false);
    }

    return (data || []).map((row) => ({
      id: row.id,
      summaryType: row.summary_type as BusinessSummaryType,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      headline: row.headline,
      status: row.status as BusinessSummaryStatus,
      createdAt: row.created_at,
    }));
  }
}
