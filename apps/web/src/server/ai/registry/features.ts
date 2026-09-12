import 'server-only';
import type { AIFeatureKey, AIPromptVersion, AIResponseSchemaVersion } from '@nnoo/contracts';

export interface AIFeatureDefinition {
  key: AIFeatureKey;
  name: string;
  description: string;
  promptVersion: AIPromptVersion;
  responseSchemaVersion: AIResponseSchemaVersion;
  requiredPermission: string | null;
  maxInputLength: number;
  maxOutputTokens: number;
  timeoutMs: number;
  toolAllowlist: string[];
  loggingPolicy: 'metadata_only' | 'standard';
  enabled: boolean;
}

/**
 * Authoritative Server AI Feature Registry.
 * Clients cannot invoke arbitrary features or override policies.
 */
export const AI_FEATURES: Record<AIFeatureKey, AIFeatureDefinition> = {
  'ai.foundation.smoke': {
    key: 'ai.foundation.smoke',
    name: 'Foundation Smoke Test',
    description: 'Internal development verification feature for Gemini connectivity, structured outputs, and audit logs.',
    promptVersion: '1.0.0',
    responseSchemaVersion: '1.0.0',
    requiredPermission: null, // Open to authenticated business members during testing
    maxInputLength: 2000,
    maxOutputTokens: 512,
    timeoutMs: 15000,
    toolAllowlist: [], // Strictly no tools
    loggingPolicy: 'metadata_only',
    enabled: true,
  },
  'ai.bookkeeper.classify': {
    key: 'ai.bookkeeper.classify',
    name: 'AI Bookkeeper Classification',
    description: 'Understands natural language bookkeeping descriptions and suggests structured operation kinds and candidate matches.',
    promptVersion: '1.0.0',
    responseSchemaVersion: '1.0.0',
    requiredPermission: null, // Role authorization strictly enforced by AIBookkeeperService
    maxInputLength: 2000,
    maxOutputTokens: 1024,
    timeoutMs: 15000,
    toolAllowlist: [], // Kept disabled; prebuilt same-tenant context is assembled deterministically
    loggingPolicy: 'metadata_only',
    enabled: true,
  },
  'ai.bookkeeper.explain': {
    key: 'ai.bookkeeper.explain',
    name: 'AI Bookkeeper Explanation',
    description: 'Explains classified transactions. Deferred to Prompt 3.',
    promptVersion: '0.1.0',
    responseSchemaVersion: '0.1.0',
    requiredPermission: 'view_financials',
    maxInputLength: 4000,
    maxOutputTokens: 1024,
    timeoutMs: 20000,
    toolAllowlist: [],
    loggingPolicy: 'metadata_only',
    enabled: false, // Intentionally disabled in Prompt 1
  },
  'ai.summary.business': {
    key: 'ai.summary.business',
    name: 'Verified Business Summaries',
    description: 'Generates verified business summaries and smart insights from canonical financial and operational reports.',
    promptVersion: '1.0.0',
    responseSchemaVersion: '1.0.0',
    requiredPermission: null, // Permission projection strictly handled by AIBusinessInsightService
    maxInputLength: 8000,
    maxOutputTokens: 2048,
    timeoutMs: 25000,
    toolAllowlist: [], // Strictly no tools; deterministic fact bundle prebuilt on server
    loggingPolicy: 'metadata_only',
    enabled: true,
  },
  'ai.ask_nnoo': {
    key: 'ai.ask_nnoo',
    name: 'Ask NNOO Business Assistant',
    description: 'Answers natural business questions using allowlisted, read-only deterministic data retrieval tools.',
    promptVersion: '1.0.0',
    responseSchemaVersion: '1.0.0',
    requiredPermission: null, // Module permissions strictly verified per tool
    maxInputLength: 4000,
    maxOutputTokens: 2048,
    timeoutMs: 30000,
    toolAllowlist: [
      'getBusinessOverview',
      'getSalesSummary',
      'getProfitabilitySummary',
      'getExpenseSummary',
      'getReceivablesSummary',
      'getPayablesSummary',
      'getInventoryStatus',
      'getInvoiceStatus',
      'getBookkeeperStatus',
      'lookupCustomer',
      'lookupProduct',
    ],
    loggingPolicy: 'metadata_only',
    enabled: true,
  },
  'ai.health.explain': {
    key: 'ai.health.explain',
    name: 'Business Health Score Explanation',
    description: 'Explains deterministic business health metrics, score drivers, and operational focus areas.',
    promptVersion: '1.0.0',
    responseSchemaVersion: '1.0.0',
    requiredPermission: 'view_reports',
    maxInputLength: 4000,
    maxOutputTokens: 1024,
    timeoutMs: 20000,
    toolAllowlist: [], // Strictly no tools; deterministic context prebuilt on server
    loggingPolicy: 'metadata_only',
    enabled: true,
  },
  'ai.credit_passport.explain': {
    key: 'ai.credit_passport.explain',
    name: 'Credit Passport Explanation',
    description: 'Explains deterministic Credit Passport profile facts, operating highlights, and data provenance.',
    promptVersion: '1.0.0',
    responseSchemaVersion: '1.0.0',
    requiredPermission: 'view_reports',
    maxInputLength: 4000,
    maxOutputTokens: 1024,
    timeoutMs: 20000,
    toolAllowlist: [], // Strictly no tools; deterministic facts prebuilt on server
    loggingPolicy: 'metadata_only',
    enabled: true,
  },
};

export function getAIFeatureDefinition(featureKey: AIFeatureKey): AIFeatureDefinition | null {
  return AI_FEATURES[featureKey] || null;
}
