import 'server-only';
import type { AIErrorCode, AIModelPolicy, AIFeatureKey } from '@nnoo/contracts';

export interface AIConfig {
  apiKey: string;
  defaultModel: string;
  enabled: boolean;
  timeoutMs: number;
  maxRetries: number;
}

/**
 * Server-only AI environment configuration.
 * Never leaks to client bundles or browser.
 */
export function getAIConfig(): AIConfig {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const defaultModel = process.env.GEMINI_MODEL_DEFAULT || 'gemini-3.6-flash';
  const enabledEnv = process.env.AI_ENABLED;
  const enabled = enabledEnv !== 'false' && enabledEnv !== '0';
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 15000;
  const maxRetries = Number(process.env.AI_MAX_RETRIES) || 2;

  return {
    apiKey,
    defaultModel,
    enabled,
    timeoutMs,
    maxRetries,
  };
}

/**
 * Centralized feature-specific model policies.
 */
export function getAIModelPolicy(featureKey: AIFeatureKey): AIModelPolicy {
  const config = getAIConfig();

  switch (featureKey) {
    case 'ai.foundation.smoke':
      return {
        defaultModel: config.defaultModel,
        temperature: 0.1,
        maxOutputTokens: 512,
        timeoutMs: config.timeoutMs,
      };
    case 'ai.bookkeeper.classify':
    case 'ai.bookkeeper.explain':
      return {
        defaultModel: config.defaultModel,
        temperature: 0.2,
        maxOutputTokens: 1024,
        timeoutMs: config.timeoutMs,
      };
    case 'ai.summary.business':
    case 'ai.health.explain':
    case 'ai.credit_passport.explain':
      return {
        defaultModel: config.defaultModel,
        temperature: 0.2,
        maxOutputTokens: 2048,
        timeoutMs: config.timeoutMs,
      };
    case 'ai.ask_nnoo':
      return {
        defaultModel: config.defaultModel,
        temperature: 0.3,
        maxOutputTokens: 2048,
        timeoutMs: config.timeoutMs,
      };
    default:
      return {
        defaultModel: config.defaultModel,
        temperature: 0.2,
        maxOutputTokens: 1024,
        timeoutMs: config.timeoutMs,
      };
  }
}
