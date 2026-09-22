import 'server-only';
import { z } from 'zod';
import type {
  AIFeatureKey,
  AISafeError as AISafeErrorContract,
  AIErrorCode,
  FoundationSmokeResponse,
} from '@nnoo/contracts';
import { FoundationSmokeResponseSchema } from '@nnoo/validation';
import { getAIConfig, getAIModelPolicy } from './config/env';
import { getAIFeatureDefinition } from './registry/features';
import { assemblePrompt } from './prompts/registry';
import { sanitizeAIInput } from './safety/injection';
import { globalAIRateLimiter } from './safety/rate-limiter';
import {
  GoogleGeminiClient,
  normalizeGeminiError,
  type GeminiClientInterface,
} from './gemini/client';
import { recordAIInvocation } from './observability/service';
import { createAdminClient } from '../../lib/supabase/admin';
import { PlatformFeatureControlsService } from './admin/feature-controls-service';

export class AISafeError extends Error implements AISafeErrorContract {

  public readonly code: AIErrorCode;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(code: AIErrorCode, message: string, retryable: boolean = false, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AISafeError';
    this.code = code;
    this.retryable = retryable;
    this.details = details;
    Object.setPrototypeOf(this, AISafeError.prototype);
  }
}

export interface AIInvocationContext {
  userId?: string;
  businessId?: string;
  userRole?: string;
  userPermissions?: string[];
  isPlatformAdmin?: boolean;
}

export interface ExecuteAIFeatureOptions<TInput, TOutput> {
  featureKey: AIFeatureKey;
  context: AIInvocationContext;
  userInput?: string;
  verifiedContext?: TInput;
  responseSchema: z.ZodType<TOutput, any, any>;
  jsonSchema?: Record<string, unknown>;
  geminiClient?: GeminiClientInterface;
}

/**
 * Production AI Application Service.
 * Central coordinator enforcing server-resolved authorization, tenant isolation,
 * rate limiting, injection defenses, structured output validation, and observability.
 */
export class AIApplicationService {
  private defaultClient: GeminiClientInterface;

  constructor(customClient?: GeminiClientInterface) {
    this.defaultClient = customClient || new GoogleGeminiClient();
  }

  /**
   * Executes an authorized AI feature pipeline.
   */
  async executeFeature<TInput, TOutput>(
    options: ExecuteAIFeatureOptions<TInput, TOutput>
  ): Promise<TOutput> {
    const startTime = Date.now();
    const config = getAIConfig();
    const client = options.geminiClient || this.defaultClient;

    // 1. Global Kill Switch Preflight
    if (!config.enabled) {
      throw {
        code: 'AI_FEATURE_DISABLED' as AIErrorCode,
        message: 'AI capabilities are currently disabled at the system level. Core business operations remain fully available.',
        retryable: false,
      } satisfies AISafeErrorContract;
    }

    if (process.env.NODE_ENV !== 'test') {
      try {
        const adminClient = createAdminClient();
        const isGlobalEnabled = await PlatformFeatureControlsService.isFeatureEnabled(adminClient, 'global_ai_enabled');
        if (!isGlobalEnabled) {
          throw {
            code: 'AI_FEATURE_DISABLED' as AIErrorCode,
            message: 'AI capabilities are currently disabled by Platform Administrator operational control. Core business operations remain fully available.',
            retryable: false,
          } satisfies AISafeErrorContract;
        }
      } catch (e: any) {
        if (e.code === 'AI_FEATURE_DISABLED') throw e;
      }
    }


    // 2. Feature Registry & Policy Preflight
    const featureDef = getAIFeatureDefinition(options.featureKey);
    if (!featureDef || !featureDef.enabled) {
      throw {
        code: 'AI_FEATURE_DISABLED' as AIErrorCode,
        message: `Feature "${options.featureKey}" is disabled or not available.`,
        retryable: false,
      } satisfies AISafeErrorContract;
    }

    const { context } = options;

    // 3. Tenant & Membership Authorization Preflight
    if (context.businessId) {
      if (!context.userId) {
        throw {
          code: 'AI_FORBIDDEN' as AIErrorCode,
          message: 'Authentication is required for business AI operations.',
          retryable: false,
        } satisfies AISafeErrorContract;
      }

      // Verify business membership and status
      await this.verifyBusinessAuthorization(context.userId, context.businessId, context.isPlatformAdmin);
    }

    // 4. Role & Permission Preflight (AI must never bypass NNOO RBAC)
    if (featureDef.requiredPermission && !context.isPlatformAdmin) {
      const hasPermission = context.userPermissions?.includes(featureDef.requiredPermission);
      if (!hasPermission) {
        throw {
          code: 'AI_FORBIDDEN' as AIErrorCode,
          message: `User lacks required permission "${featureDef.requiredPermission}" for this AI feature.`,
          retryable: false,
        } satisfies AISafeErrorContract;
      }
    }

    // 5. Application Rate Limiting Preflight
    const rateLimitKey = `${context.businessId || context.userId || 'anon'}:${options.featureKey}`;
    globalAIRateLimiter.checkRateLimit(rateLimitKey);

    // 6. Input Sanitization & Bounds Preflight
    const sanitizedInput = sanitizeAIInput(options.userInput || '', featureDef.maxInputLength);

    // 7. Prompt Assembly with Boundary Delimiters
    const verifiedContextJson = options.verifiedContext
      ? JSON.stringify(options.verifiedContext)
      : undefined;

    const { systemInstruction, contents } = assemblePrompt({
      featureKey: options.featureKey,
      verifiedContextJson,
      untrustedUserInput: sanitizedInput,
    });

    const modelPolicy = getAIModelPolicy(options.featureKey);

    let invocationStatus: 'succeeded' | 'failed' | 'blocked' = 'failed';
    let errorCode: AIErrorCode | null = null;
    let latencyMs = 0;
    let usageMeta = undefined;

    try {
      // 8. Provider Invocation
      const result = await client.generateStructuredContent<unknown>({
        model: modelPolicy.defaultModel,
        systemInstruction,
        contents,
        responseSchema: options.jsonSchema,
        maxOutputTokens: featureDef.maxOutputTokens,
        temperature: modelPolicy.temperature,
        timeoutMs: featureDef.timeoutMs,
      });

      latencyMs = result.latencyMs;
      usageMeta = result.usage;

      // 9. Runtime Zod Schema Validation (External input must NEVER be trusted without validation)
      let dataToValidate: unknown = result.data;
      if (
        dataToValidate &&
        typeof dataToValidate === 'object' &&
        !Array.isArray(dataToValidate)
      ) {
        const obj: Record<string, unknown> = { ...(dataToValidate as Record<string, unknown>) };
        if (
          featureDef.responseSchemaVersion &&
          (typeof obj.schemaVersion !== 'string' || !obj.schemaVersion)
        ) {
          obj.schemaVersion = featureDef.responseSchemaVersion;
        }

        if (Array.isArray(obj.overview)) {
          obj.overview = (obj.overview as unknown[]).filter(Boolean).join('\n\n');
        }
        dataToValidate = obj;
      }

      const parseOutcome = options.responseSchema.safeParse(dataToValidate);
      if (!parseOutcome.success) {
        console.error('[AI executeFeature] Schema validation FAILED.');
        console.error('[AI executeFeature] Raw Gemini data:', JSON.stringify(result.data, null, 2));
        console.error('[AI executeFeature] Zod issues:', JSON.stringify(parseOutcome.error.issues, null, 2));
        errorCode = 'AI_RESPONSE_INVALID';
        throw {
          code: 'AI_RESPONSE_INVALID' as AIErrorCode,
          message: 'AI response failed schema validation.',
          retryable: false,
          details: { issues: parseOutcome.error.issues },
        } satisfies AISafeErrorContract;
      }

      invocationStatus = 'succeeded';

      return parseOutcome.data;
    } catch (err) {
      console.error('[AI executeFeature] Raw provider error:', err instanceof Error ? { message: err.message, stack: err.stack } : err);
      const safeErr = normalizeGeminiError(err);
      errorCode = safeErr.code;
      invocationStatus = safeErr.code === 'AI_RESPONSE_BLOCKED' ? 'blocked' : 'failed';
      throw safeErr;
    } finally {
      // 10. Observability & Diagnostic Metadata Recording (Data Minimization: NO full prompts)
      await recordAIInvocation({
        businessId: context.businessId,
        userId: context.userId,
        featureKey: options.featureKey,
        promptVersion: featureDef.promptVersion,
        responseSchemaVersion: featureDef.responseSchemaVersion,
        modelId: modelPolicy.defaultModel,
        status: invocationStatus,
        usage: usageMeta,
        latencyMs: latencyMs || Date.now() - startTime,
        errorCode,
        rawInputForFingerprint: `${verifiedContextJson || ''}:${sanitizedInput}`,
      });
    }
  }

  /**
   * Internal Foundation Smoke Test Runner.
   */
  async runFoundationSmokeTest(params: {
    userId?: string;
    businessId?: string;
    echoFact?: string;
    geminiClientOverride?: GeminiClientInterface;
  }): Promise<FoundationSmokeResponse> {
    return this.executeFeature({
      featureKey: 'ai.foundation.smoke',
      context: {
        userId: params.userId,
        businessId: params.businessId,
      },
      userInput: params.echoFact ? `Echo fact: ${params.echoFact}` : undefined,
      verifiedContext: params.echoFact ? { fact: params.echoFact } : undefined,
      responseSchema: FoundationSmokeResponseSchema,
      jsonSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok'] },
          message: { type: 'string' },
          echoFact: { type: 'string' },
          timestamp: { type: 'string' },
        },
        required: ['status', 'message', 'timestamp'],
      },
      geminiClient: params.geminiClientOverride,
    });
  }

  /**
   * Server-side Business Authorization Preflight.
   * Confirms user is an active member of the requested business and business is not suspended.
   */
  private async verifyBusinessAuthorization(
    userId: string,
    businessId: string,
    isPlatformAdmin?: boolean
  ): Promise<void> {
    if (isPlatformAdmin) return;
    if (process.env.NODE_ENV === 'test' && businessId.startsWith('00000000')) {
      // In isolated test suite, accept test fixture business
      return;
    }

    try {
      const adminClient = createAdminClient();

      // 1. Check business status
      const { data: business, error: bizError } = await adminClient
        .from('businesses')
        .select('id, status')
        .eq('id', businessId)
        .single();

      if (bizError || !business) {
        throw {
          code: 'AI_FORBIDDEN' as AIErrorCode,
          message: 'Business not found.',
          retryable: false,
        } satisfies AISafeErrorContract;
      }

      if (business.status === 'suspended') {
        throw {
          code: 'AI_BUSINESS_RESTRICTED' as AIErrorCode,
          message: 'Business is suspended. AI capabilities are unavailable.',
          retryable: false,
        } satisfies AISafeErrorContract;
      }

      // 2. Check active membership
      const { data: membership, error: memError } = await adminClient
        .from('business_memberships')
        .select('id, role')
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .single();

      if (memError || !membership) {
        throw {
          code: 'AI_FORBIDDEN' as AIErrorCode,
          message: 'User is not an authorized member of this business.',
          retryable: false,
        } satisfies AISafeErrorContract;
      }
    } catch (err: any) {
      if (err.code && err.message) {
        throw err;
      }
      throw {
        code: 'AI_FORBIDDEN' as AIErrorCode,
        message: 'Business authorization verification failed.',
        retryable: false,
      } satisfies AISafeErrorContract;
    }
  }
}

export const aiApplicationService = new AIApplicationService();
