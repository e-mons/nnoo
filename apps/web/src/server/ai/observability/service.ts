import 'server-only';
import { createHash } from 'crypto';
import type {
  AIFeatureKey,
  AIPromptVersion,
  AIResponseSchemaVersion,
  AIInvocationStatus,
  AIErrorCode,
  AIUsageMetadata,
} from '@nnoo/contracts';
import { createAdminClient } from '../../../lib/supabase/admin';
import { aiLogger } from './logger';

export interface RecordInvocationParams {
  businessId?: string | null;
  userId?: string | null;
  featureKey: AIFeatureKey;
  promptVersion: AIPromptVersion;
  responseSchemaVersion: AIResponseSchemaVersion;
  modelId: string;
  status: AIInvocationStatus;
  providerRequestId?: string | null;
  usage?: AIUsageMetadata | null;
  latencyMs?: number | null;
  errorCode?: AIErrorCode | null;
  rawInputForFingerprint?: string | null;
  completedAt?: string | null;
}

/**
 * Computes a deterministic, non-reversible SHA-256 fingerprint of the context/input.
 */
export function computeRequestFingerprint(input?: string | null): string | null {
  if (!input) return null;
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Persists an AI invocation diagnostic record into `public.ai_invocations`.
 * Ensures data minimization: raw prompts and full AI responses are NEVER stored by default.
 */
export async function recordAIInvocation(
  params: RecordInvocationParams
): Promise<string | null> {
  const fingerprint = computeRequestFingerprint(params.rawInputForFingerprint);

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('ai_invocations')
      .insert({
        business_id: params.businessId ?? null,
        user_id: params.userId ?? null,
        feature_key: params.featureKey,
        prompt_version: params.promptVersion,
        response_schema_version: params.responseSchemaVersion,
        model_id: params.modelId,
        status: params.status,
        provider_request_id: params.providerRequestId ?? null,
        input_tokens: params.usage?.inputTokens ?? null,
        output_tokens: params.usage?.outputTokens ?? null,
        total_tokens: params.usage?.totalTokens ?? null,
        latency_ms: params.latencyMs ?? null,
        error_code: params.errorCode ?? null,
        request_fingerprint: fingerprint,
        completed_at: params.completedAt ?? new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      aiLogger.warn('Failed to persist AI invocation audit record to database', {
        error: error.message,
        featureKey: params.featureKey,
      });
      return null;
    }

    return data.id;
  } catch (err) {
    aiLogger.warn('Error recording AI invocation audit record', {
      error: err instanceof Error ? err.message : String(err),
      featureKey: params.featureKey,
    });
    return null;
  }
}
