import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AiOperationsMetrics,
  AiModelRegistryEntry,
  AiPromptVersionEntry,
  AiFeatureUsageMetrics,
  IntelligenceReportingPeriod,
  AiProviderOperationalStatus,
  IntelligenceSystemStatus,
} from '@nnoo/contracts/ai';
import { getAIConfig } from '../config/env';
import { AISafeError } from '../service';


export function getAIModelRegistry(): AiModelRegistryEntry[] {
  const config = getAIConfig();
  const currentModel = config.defaultModel || 'gemini-3.6-flash';

  return [
    {
      featureKey: 'ai_bookkeeper',
      featureName: 'AI Bookkeeper Classification',
      modelId: currentModel,
      configVersion: 'v1.0',
      status: 'ACTIVE',
      inputPricePer1MTokensUsd: 0.075,
      outputPricePer1MTokensUsd: 0.30,
      lastUsedAt: null,
    },
    {
      featureKey: 'business_summaries',
      featureName: 'Verified Business Summaries & Insights',
      modelId: currentModel,
      configVersion: 'v1.0',
      status: 'ACTIVE',
      inputPricePer1MTokensUsd: 0.075,
      outputPricePer1MTokensUsd: 0.30,
      lastUsedAt: null,
    },
    {
      featureKey: 'ask_nnoo',
      featureName: 'Ask NNOO Business AI Assistant',
      modelId: currentModel,
      configVersion: 'v1.0',
      status: 'ACTIVE',
      inputPricePer1MTokensUsd: 0.075,
      outputPricePer1MTokensUsd: 0.30,
      lastUsedAt: null,
    },
    {
      featureKey: 'health_explanation',
      featureName: 'Business Health Explanation',
      modelId: currentModel,
      configVersion: 'v1.0',
      status: 'ACTIVE',
      inputPricePer1MTokensUsd: 0.075,
      outputPricePer1MTokensUsd: 0.30,
      lastUsedAt: null,
    },
    {
      featureKey: 'credit_passport_explanation',
      featureName: 'Credit Passport Explanation',
      modelId: currentModel,
      configVersion: 'v1.0',
      status: 'ACTIVE',
      inputPricePer1MTokensUsd: 0.075,
      outputPricePer1MTokensUsd: 0.30,
      lastUsedAt: null,
    },
  ];
}

export const AI_MODEL_REGISTRY: AiModelRegistryEntry[] = getAIModelRegistry();

export const AI_PROMPT_REGISTRY: AiPromptVersionEntry[] = [
  {
    featureKey: 'ai_bookkeeper',
    featureName: 'AI Bookkeeper Transaction Understanding',
    promptVersion: 'ai.bookkeeper.classify.v1',
    responseSchemaVersion: 'ai.bookkeeper.classify.schema.v1',
    status: 'ACTIVE',
    isSourceControlled: true,
    description: 'Classifies business transactions into candidate operations, categories, and counterparties with candidate keys.',
  },
  {
    featureKey: 'business_summaries',
    featureName: 'Verified Business Summaries',
    promptVersion: 'ai.business_summary.v1',
    responseSchemaVersion: 'ai.business_summary.schema.v1',
    status: 'ACTIVE',
    isSourceControlled: true,
    description: 'Generates narrative overviews from canonical verified business fact snapshots.',
  },
  {
    featureKey: 'ask_nnoo',
    featureName: 'Ask NNOO Assistant',
    promptVersion: 'ai.ask_nnoo.v1',
    responseSchemaVersion: 'ai.ask_nnoo.schema.v1',
    status: 'ACTIVE',
    isSourceControlled: true,
    description: 'Conversational assistant with tool execution for business queries and deterministic facts.',
  },
  {
    featureKey: 'health_explanation',
    featureName: 'Business Health Score Explanation',
    promptVersion: 'ai.health.explain.v1',
    responseSchemaVersion: 'ai.health.explain.schema.v1',
    status: 'ACTIVE',
    isSourceControlled: true,
    description: 'Explains deterministic Business Health Score dimensions and strength/attention reasons.',
  },
  {
    featureKey: 'credit_passport_explanation',
    featureName: 'Credit Passport Narrative',
    promptVersion: 'ai.credit_passport.explain.v1',
    responseSchemaVersion: 'ai.credit_passport.explain.schema.v1',
    status: 'ACTIVE',
    isSourceControlled: true,
    description: 'Explains verified historical track record and operational timeline for Credit Passport.',
  },
];

export class AiOperationsService {
  /**
   * Helper to compute ISO start timestamp for reporting window.
   */
  public static getPeriodStartTimestamp(period: IntelligenceReportingPeriod): string {
    const now = Date.now();
    let millis = 24 * 60 * 60 * 1000;
    if (period === '7d') millis = 7 * 24 * 60 * 60 * 1000;
    if (period === '30d') millis = 30 * 24 * 60 * 60 * 1000;
    return new Date(now - millis).toISOString();
  }

  /**
   * Retrieves full AI Operations telemetry for Platform Admin.
   */
  public static async getOperationsMetrics(
    supabase: SupabaseClient,
    period: IntelligenceReportingPeriod = '24h'
  ): Promise<AiOperationsMetrics> {
    const config = getAIConfig();
    const periodStart = this.getPeriodStartTimestamp(period);

    // Fetch all invocations in the time period
    const { data: invocations, error } = await supabase
      .from('ai_invocations')
      .select('*')
      .gte('created_at', periodStart)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AISafeError(
        'ADMIN_INTERNAL_ERROR' as any,
        `Failed to retrieve AI invocations: ${error.message}`,
        false
      );
    }

    const rows = invocations || [];
    let totalInvocations = rows.length;
    let successfulInvocations = 0;
    let failedInvocations = 0;
    let timeoutCount = 0;
    let rateLimitedCount = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let totalLatencyMs = 0;
    let latencyCount = 0;
    let lastSuccessfulInvocationAt: string | null = null;
    let lastFailureAt: string | null = null;
    let lastFailureReason: string | null = null;

    // Feature breakdown accumulators
    const featureMap: Record<
      string,
      {
        invocations: number;
        successful: number;
        failed: number;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        totalLatency: number;
        latencyCount: number;
      }
    > = {};

    // Initialize map with known features
    for (const f of AI_MODEL_REGISTRY) {
      featureMap[f.featureKey] = {
        invocations: 0,
        successful: 0,
        failed: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalLatency: 0,
        latencyCount: 0,
      };
    }

    for (const row of rows) {
      const isSuccess = row.status === 'succeeded';
      const isFailed = row.status === 'failed' || row.status === 'blocked';
      const isTimeout = row.status === 'timeout';
      const isRateLimited = row.status === 'rate_limited';

      if (isSuccess) {
        successfulInvocations++;
        if (!lastSuccessfulInvocationAt) lastSuccessfulInvocationAt = row.created_at;
      }
      if (isFailed || isTimeout || isRateLimited) {
        failedInvocations++;
        if (!lastFailureAt) {
          lastFailureAt = row.created_at;
          lastFailureReason = row.error_code || row.status;
        }
      }
      if (isTimeout) timeoutCount++;
      if (isRateLimited) rateLimitedCount++;

      const inTok = row.input_tokens || 0;
      const outTok = row.output_tokens || 0;
      const totTok = row.total_tokens || inTok + outTok;

      totalInputTokens += inTok;
      totalOutputTokens += outTok;
      totalTokens += totTok;

      if (row.latency_ms && row.latency_ms > 0) {
        totalLatencyMs += row.latency_ms;
        latencyCount++;
      }

      // Populate feature breakdown
      const fKey = row.feature_key;
      if (!featureMap[fKey]) {
        featureMap[fKey] = {
          invocations: 0,
          successful: 0,
          failed: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          totalLatency: 0,
          latencyCount: 0,
        };
      }

      featureMap[fKey].invocations++;
      if (isSuccess) featureMap[fKey].successful++;
      if (isFailed || isTimeout || isRateLimited) featureMap[fKey].failed++;
      featureMap[fKey].inputTokens += inTok;
      featureMap[fKey].outputTokens += outTok;
      featureMap[fKey].totalTokens += totTok;
      if (row.latency_ms && row.latency_ms > 0) {
        featureMap[fKey].totalLatency += row.latency_ms;
        featureMap[fKey].latencyCount++;
      }
    }

    const averageLatencyMs =
      latencyCount > 0 ? Math.round(totalLatencyMs / latencyCount) : 0;

    // Determine Provider Status based on NNOO observations
    let providerStatus: IntelligenceSystemStatus = 'HEALTHY';
    if (!config.apiKey || config.apiKey.trim() === '') {
      providerStatus = 'NOT_CONFIGURED';
    } else if (totalInvocations > 0) {
      const failureRate = failedInvocations / totalInvocations;
      if (failureRate > 0.3) {
        providerStatus = 'DEGRADED';
      }
      if (failureRate > 0.8 && totalInvocations >= 5) {
        providerStatus = 'UNAVAILABLE';
      }
    }

    const providerOperationalStatus: AiProviderOperationalStatus = {
      status: providerStatus,
      isConfigured: Boolean(config.apiKey && config.apiKey.trim() !== ''),
      configuredModel: config.defaultModel || 'gemini-2.5-flash',
      activeEnvironment: process.env.NODE_ENV || 'development',

      totalInvocations,
      successfulInvocations,
      failedInvocations,
      timeoutCount,
      rateLimitedCount,
      averageLatencyMs,
      lastSuccessfulInvocationAt,
      lastFailureAt,
      lastFailureReason,
    };

    // Calculate Estimated Costs
    // Gemini Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens
    let estimatedTotalCostUsd: number | null = null;
    let costLabel: 'Exact' | 'Estimated from configured pricing (USD)' | 'Unavailable' = 'Unavailable';

    if (totalTokens > 0) {
      const inputCost = (totalInputTokens / 1_000_000) * 0.075;
      const outputCost = (totalOutputTokens / 1_000_000) * 0.30;
      estimatedTotalCostUsd = Math.round((inputCost + outputCost) * 10000) / 10000;
      costLabel = 'Estimated from configured pricing (USD)';
    }

    // Build features breakdown list
    const features: AiFeatureUsageMetrics[] = Object.entries(featureMap).map(
      ([key, stats]) => {
        const featureDef = AI_MODEL_REGISTRY.find((r) => r.featureKey === key);
        const name = featureDef?.featureName || key;
        let featureCost: number | null = null;
        let featureCostLabel: 'Exact' | 'Estimated from configured pricing (USD)' | 'Unavailable' = 'Unavailable';

        if (stats.totalTokens > 0) {
          const inCost = (stats.inputTokens / 1_000_000) * 0.075;
          const outCost = (stats.outputTokens / 1_000_000) * 0.30;
          featureCost = Math.round((inCost + outCost) * 10000) / 10000;
          featureCostLabel = 'Estimated from configured pricing (USD)';
        }

        return {
          featureKey: key,
          featureName: name,
          invocations: stats.invocations,
          successful: stats.successful,
          failed: stats.failed,
          totalTokens: stats.totalTokens,
          estimatedCostUsd: featureCost,
          costLabel: featureCostLabel,
          averageLatencyMs:
            stats.latencyCount > 0
              ? Math.round(stats.totalLatency / stats.latencyCount)
              : 0,
        };
      }
    );

    // Recent failures (sanitized and privacy-safe)
    const recentFailures = rows
      .filter((r) => r.status !== 'succeeded')
      .slice(0, 15)
      .map((r) => ({
        id: r.id,
        featureKey: r.feature_key,
        businessId: r.business_id,
        modelId: r.model_id,
        promptVersion: r.prompt_version,
        errorCode: r.error_code || r.status,
        latencyMs: r.latency_ms,
        createdAt: r.created_at,
      }));

    return {
      period,
      providerStatus: providerOperationalStatus,
      totalInvocations,
      successfulInvocations,
      failedInvocations,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      estimatedTotalCostUsd,
      costLabel,
      averageLatencyMs,
      features,
      modelRegistry: getAIModelRegistry(),
      promptRegistry: AI_PROMPT_REGISTRY,
      recentFailures,
    };
  }
}
