import 'server-only';

/**
 * Indicative / Estimated Provider Pricing Configuration.
 * 
 * IMPORTANT: This pricing configuration is purely for diagnostic estimation.
 * Token and model usage are the authoritative audit facts.
 * Commercial plan quotas or billing charges MUST NOT be calculated from this table.
 */
export interface ModelPricingEstimate {
  modelId: string;
  costPer1kInputTokensUSD: number;
  costPer1kOutputTokensUSD: number;
  lastVerified: string;
}

export const ESTIMATED_MODEL_PRICING: Record<string, ModelPricingEstimate> = {
  'gemini-2.5-flash': {
    modelId: 'gemini-2.5-flash',
    costPer1kInputTokensUSD: 0.000075,
    costPer1kOutputTokensUSD: 0.0003,
    lastVerified: '2026-08',
  },
  'gemini-3.6-flash': {
    modelId: 'gemini-3.6-flash',
    costPer1kInputTokensUSD: 0.0001,
    costPer1kOutputTokensUSD: 0.0004,
    lastVerified: '2026-08',
  },
};

/**
 * Calculates estimated monetary cost from actual token counts.
 * Returns null if token counts are missing or model pricing is unmapped.
 */
export function estimateInvocationCostUSD(
  modelId: string,
  inputTokens?: number | null,
  outputTokens?: number | null
): { estimatedCostUSD: number; isEstimate: true } | null {
  if (inputTokens == null && outputTokens == null) return null;
  const pricing = ESTIMATED_MODEL_PRICING[modelId];
  if (!pricing) return null;

  const inCost = ((inputTokens || 0) / 1000) * pricing.costPer1kInputTokensUSD;
  const outCost = ((outputTokens || 0) / 1000) * pricing.costPer1kOutputTokensUSD;

  return {
    estimatedCostUSD: Number((inCost + outCost).toFixed(6)),
    isEstimate: true,
  };
}
