import 'server-only';
import { GoogleGenAI } from '@google/genai';
import type {
  AIErrorCode,
  AISafeError,
  AIUsageMetadata,
} from '@nnoo/contracts';
import { getAIConfig } from '../config/env';

export interface GenerateStructuredParams {
  model: string;
  systemInstruction?: string;
  contents: string;
  responseSchema?: Record<string, unknown>;
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface StructuredGenerationResult<T> {
  data: T;
  rawText: string;
  usage: AIUsageMetadata;
  model: string;
  providerRequestId?: string;
  latencyMs: number;
}

export interface GeminiClientInterface {
  generateStructuredContent<T>(
    params: GenerateStructuredParams
  ): Promise<StructuredGenerationResult<T>>;
}

/**
 * Normalizes provider or network errors into a safe AISafeError contract.
 * Prevents raw keys, stack traces, or internal URLs from leaking.
 */
export function normalizeGeminiError(error: unknown): AISafeError {
  if (typeof error === 'object' && error !== null && 'code' in error && 'retryable' in error) {
    return error as AISafeError;
  }

  const errString = error instanceof Error ? error.message : String(error);
  const lower = errString.toLowerCase();

  if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('forbidden')) {
    return {
      code: 'AI_CONFIGURATION_UNAVAILABLE',
      message: 'AI service credential configuration is unavailable or invalid.',
      retryable: false,
    };
  }

  if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')) {
    return {
      code: 'AI_PROVIDER_RATE_LIMITED',
      message: 'AI provider capacity limit exceeded. Please try again shortly.',
      retryable: true,
    };
  }

  if (lower.includes('timeout') || lower.includes('aborted') || lower.includes('deadline')) {
    return {
      code: 'AI_PROVIDER_TIMEOUT',
      message: 'AI request timed out. Please try again.',
      retryable: true,
    };
  }

  if (lower.includes('blocked') || lower.includes('safety') || lower.includes('harm')) {
    return {
      code: 'AI_RESPONSE_BLOCKED',
      message: 'AI content generation was blocked by safety policy.',
      retryable: false,
    };
  }

  if (
    lower.includes('500') ||
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('fetch failed') ||
    lower.includes('econnreset')
  ) {
    return {
      code: 'AI_PROVIDER_UNAVAILABLE',
      message: 'AI provider is temporarily unavailable. Business operations remain unaffected.',
      retryable: true,
    };
  }

  return {
    code: 'AI_INTERNAL_ERROR',
    message: 'An error occurred during AI processing.',
    retryable: false,
  };
}

/**
 * Production Google Gemini Server Client using `@google/genai`.
 */
export class GoogleGeminiClient implements GeminiClientInterface {
  private ai: GoogleGenAI | null = null;
  private apiKey: string;

  constructor(apiKeyOverride?: string) {
    const config = getAIConfig();
    this.apiKey = apiKeyOverride ?? config.apiKey;
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  async generateStructuredContent<T>(
    params: GenerateStructuredParams
  ): Promise<StructuredGenerationResult<T>> {
    const config = getAIConfig();
    const activeApiKey = this.apiKey || config.apiKey;

    if (!activeApiKey) {
      throw {
        code: 'AI_CONFIGURATION_UNAVAILABLE' as AIErrorCode,
        message: 'Google Gemini API key is not configured on the server.',
        retryable: false,
      } satisfies AISafeError;
    }

    const aiClient = this.ai || new GoogleGenAI({ apiKey: activeApiKey });
    const timeoutMs = params.timeoutMs ?? config.timeoutMs;
    const maxRetries = config.maxRetries;

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= maxRetries) {
      const startTime = Date.now();
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('AI_PROVIDER_TIMEOUT: Request timed out'));
          }, timeoutMs);
        });

        const requestPromise = aiClient.models.generateContent({
          model: params.model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: params.responseSchema as any,
            maxOutputTokens: params.maxOutputTokens,
            temperature: params.temperature,
          },
        });

        const response = await Promise.race([requestPromise, timeoutPromise]);
        const latencyMs = Date.now() - startTime;

        const rawText = response.text ?? '';
        if (!rawText) {
          throw {
            code: 'AI_RESPONSE_BLOCKED' as AIErrorCode,
            message: 'Provider returned an empty response or content was blocked.',
            retryable: false,
          } satisfies AISafeError;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          throw {
            code: 'AI_RESPONSE_INVALID' as AIErrorCode,
            message: 'Provider failed to return valid structured JSON.',
            retryable: false,
          } satisfies AISafeError;
        }

        const usage: AIUsageMetadata = {
          inputTokens: response.usageMetadata?.promptTokenCount,
          outputTokens: response.usageMetadata?.candidatesTokenCount,
          totalTokens: response.usageMetadata?.totalTokenCount,
        };

        return {
          data: parsed as T,
          rawText,
          usage,
          model: params.model,
          latencyMs,
        };
      } catch (err: any) {
        console.error('[GoogleGeminiClient] Raw attempt error:', err instanceof Error ? { message: err.message, name: err.name, stack: err.stack?.substring(0, 500) } : JSON.stringify(err)?.substring(0, 500));
        lastError = err;
        const normalized = normalizeGeminiError(err);

        // If error is not retryable or we reached max retries, fail immediately
        if (!normalized.retryable || attempt === maxRetries) {
          throw normalized;
        }

        // Bounded exponential backoff with jitter: 200ms, 600ms, ...
        const backoffMs = Math.min(200 * Math.pow(2, attempt) + Math.random() * 100, 2000);
        await new Promise((res) => setTimeout(res, backoffMs));
        attempt++;
      }
    }

    throw normalizeGeminiError(lastError);
  }
}

/**
 * Deterministic Test Double for Gemini Client.
 * Used in unit/integration testing without making external API calls.
 */
export class MockGeminiClient<_TDefault = unknown> implements GeminiClientInterface {
  private mockHandler?: (params: GenerateStructuredParams) => Promise<unknown> | unknown;

  constructor(mockHandler?: (params: GenerateStructuredParams) => Promise<unknown> | unknown) {
    this.mockHandler = mockHandler;
  }

  setMockHandler(handler: (params: GenerateStructuredParams) => Promise<unknown> | unknown) {
    this.mockHandler = handler;
  }

  async generateStructuredContent<T>(
    params: GenerateStructuredParams
  ): Promise<StructuredGenerationResult<T>> {
    const startTime = Date.now();

    if (!this.mockHandler) {
      // Default harmless response
      const defaultData = {
        status: 'ok',
        message: 'Mock Gemini response',
        timestamp: new Date().toISOString(),
      } as unknown as T;

      return {
        data: defaultData,
        rawText: JSON.stringify(defaultData),
        usage: {
          inputTokens: 25,
          outputTokens: 15,
          totalTokens: 40,
        },
        model: params.model,
        latencyMs: Date.now() - startTime + 5,
      };
    }

    try {
      const result = await this.mockHandler(params);
      return {
        data: result as T,
        rawText: JSON.stringify(result),
        usage: {
          inputTokens: 30,
          outputTokens: 20,
          totalTokens: 50,
        },
        model: params.model,
        latencyMs: Date.now() - startTime + 5,
      };
    } catch (err) {
      throw normalizeGeminiError(err);
    }
  }
}
