import { z } from '@nnoo/validation';

declare const process: any;

export type NnooEnvironment = 'development' | 'preview' | 'production' | 'test';

export interface ProviderReadiness {
  configured: boolean;
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'MISMATCH' | 'DISABLED';
  environment?: string;
  details?: string;
}

export interface PlatformProviderStatus {
  environment: NnooEnvironment;
  supabase: ProviderReadiness;
  paystack: ProviderReadiness;
  gemini: ProviderReadiness;
  whatsapp: ProviderReadiness;
  inngest: ProviderReadiness;
  push: ProviderReadiness;
}

/**
 * Strict boolean parser that handles "true", "false", "1", "0", and booleans.
 * Rejects loose truthy strings like "Boolean('false') === true".
 */
export function parseStrictBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'true' || trimmed === '1') return true;
    if (trimmed === 'false' || trimmed === '0' || trimmed === '') return false;
  }
  return defaultValue;
}

/**
 * Strict integer parser that rejects NaN and decimal numbers.
 */
export function parseStrictInteger(value: unknown, defaultValue: number, min?: number, max?: number): number {
  if (typeof value === 'number' && !Number.isNaN(value) && Number.isInteger(value)) {
    if (min !== undefined && value < min) return defaultValue;
    if (max !== undefined && value > max) return defaultValue;
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10);
    if (!Number.isNaN(parsed)) {
      if (min !== undefined && parsed < min) return defaultValue;
      if (max !== undefined && parsed > max) return defaultValue;
      return parsed;
    }
  }
  return defaultValue;
}

/**
 * Server Configuration Schema.
 * Validates all server-side environment variables.
 * Secrets must never be logged or echoed in validation errors.
 */
export const ServerConfigSchema = z.object({
  NNOO_ENV: z.enum(['development', 'preview', 'production', 'test']).default('development'),
  NODE_ENV: z.enum(['development', 'preview', 'production', 'test']).default('development'),
  
  // Core Supabase Backend
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, { message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, { message: 'SUPABASE_SERVICE_ROLE_KEY must be a valid service role key' }),
  
  // Web Application Origin
  NEXT_PUBLIC_SITE_URL: z.string().url({ message: 'NEXT_PUBLIC_SITE_URL must be a valid URL' }).default('http://localhost:3000'),

  // Paystack Provider Configuration
  PAYSTACK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_ENVIRONMENT: z.enum(['test', 'live']).optional(),

  // Google Gemini AI Configuration
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL_DEFAULT: z.string().default('gemini-3.6-flash'),
  AI_ENABLED: z.boolean().default(true),
  AI_TIMEOUT_MS: z.number().int().positive().default(15000),
  AI_MAX_RETRIES: z.number().int().min(0).max(5).default(2),

  // Meta WhatsApp Business Platform Configuration
  WHATSAPP_ENABLED: z.boolean().default(false),
  WHATSAPP_PROVIDER: z.string().default('meta_cloud_api'),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_GRAPH_API_VERSION: z.string().default('v20.0'),
  WHATSAPP_PEPPER: z.string().default('nnoo-default-whatsapp-pepper-salt-2026'),

  // Inngest Durable Job Foundation
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  INNGEST_APP_ID: z.string().default('nnoo-web'),

  // Expo Push Notifications
  EXPO_ACCESS_TOKEN: z.string().optional(),

  // Resend Transactional Email
  RESEND_API_KEY: z.string().optional(),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * Public Client Configuration Schema (Browser Safe).
 * Only contains non-sensitive variables intended for browser bundles.
 */
export const PublicClientConfigSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
});

export type PublicClientConfig = z.infer<typeof PublicClientConfigSchema>;

/**
 * Mobile Client Configuration Schema (Expo / React Native Safe).
 * Only contains non-sensitive variables intended for native app bundles.
 */
export const MobileClientConfigSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  EXPO_PUBLIC_API_URL: z.string().url().optional(),
});

export type MobileClientConfig = z.infer<typeof MobileClientConfigSchema>;

/**
 * Validates server configuration from process.env or a custom dictionary.
 * Sanitizes errors so secrets are never echoed in error messages.
 */
export function validateServerConfig(rawEnv?: Record<string, string | undefined>): ServerConfig {
  const envSource = rawEnv || (typeof process !== 'undefined' ? process.env : {});
  const nnooEnv = (envSource.NNOO_ENV || envSource.NODE_ENV || 'development') as NnooEnvironment;
  
  const rawData = {
    NNOO_ENV: nnooEnv,
    NODE_ENV: envSource.NODE_ENV || 'development',
    NEXT_PUBLIC_SUPABASE_URL: envSource.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: envSource.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: envSource.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    
    PAYSTACK_SECRET_KEY: envSource.PAYSTACK_SECRET_KEY || undefined,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: envSource.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || undefined,
    PAYSTACK_ENVIRONMENT: envSource.PAYSTACK_ENVIRONMENT as 'test' | 'live' | undefined,

    GEMINI_API_KEY: envSource.GEMINI_API_KEY || undefined,
    GEMINI_MODEL_DEFAULT: envSource.GEMINI_MODEL_DEFAULT || 'gemini-3.6-flash',
    AI_ENABLED: parseStrictBoolean(envSource.AI_ENABLED, true),
    AI_TIMEOUT_MS: parseStrictInteger(envSource.AI_TIMEOUT_MS, 15000, 1000, 60000),
    AI_MAX_RETRIES: parseStrictInteger(envSource.AI_MAX_RETRIES, 2, 0, 5),

    WHATSAPP_ENABLED: parseStrictBoolean(envSource.WHATSAPP_ENABLED, false),
    WHATSAPP_PROVIDER: envSource.WHATSAPP_PROVIDER || 'meta_cloud_api',
    WHATSAPP_ACCESS_TOKEN: envSource.WHATSAPP_ACCESS_TOKEN || undefined,
    WHATSAPP_PHONE_NUMBER_ID: envSource.WHATSAPP_PHONE_NUMBER_ID || undefined,
    WHATSAPP_BUSINESS_ACCOUNT_ID: envSource.WHATSAPP_BUSINESS_ACCOUNT_ID || undefined,
    WHATSAPP_APP_SECRET: envSource.WHATSAPP_APP_SECRET || undefined,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: envSource.WHATSAPP_WEBHOOK_VERIFY_TOKEN || undefined,
    WHATSAPP_GRAPH_API_VERSION: envSource.WHATSAPP_GRAPH_API_VERSION || 'v20.0',
    WHATSAPP_PEPPER: envSource.WHATSAPP_PEPPER || 'nnoo-default-whatsapp-pepper-salt-2026',

    INNGEST_EVENT_KEY: envSource.INNGEST_EVENT_KEY || undefined,
    INNGEST_SIGNING_KEY: envSource.INNGEST_SIGNING_KEY || undefined,
    INNGEST_APP_ID: envSource.INNGEST_APP_ID || 'nnoo-web',

    EXPO_ACCESS_TOKEN: envSource.EXPO_ACCESS_TOKEN || undefined,
    RESEND_API_KEY: envSource.RESEND_API_KEY || undefined,
  };

  const parsed = ServerConfigSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const errorDetails = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : ''}`)
      .join('; ');
    throw new Error(`[NNOO Config Error] Server configuration validation failed: ${errorDetails}`);
  }

  // Cross-variable environment validation checks
  const config = parsed.data;
  const paystackCheck = assertPaystackEnvironment(config.NNOO_ENV, config.PAYSTACK_SECRET_KEY, config.PAYSTACK_ENVIRONMENT);
  if (!paystackCheck.valid) {
    throw new Error(`[NNOO Config Error] Paystack environment mismatch: ${paystackCheck.error}`);
  }

  return config;
}

/**
 * Validates public client configuration safely.
 */
export function validatePublicClientConfig(rawEnv?: Record<string, string | undefined>): PublicClientConfig {
  const envSource = rawEnv || (typeof process !== 'undefined' ? process.env : {});
  const rawData = {
    NEXT_PUBLIC_SUPABASE_URL: envSource.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: envSource.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: envSource.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || undefined,
  };

  const parsed = PublicClientConfigSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const errorDetails = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : ''}`)
      .join('; ');
    throw new Error(`[NNOO Config Error] Public client configuration validation failed: ${errorDetails}`);
  }

  return parsed.data;
}

/**
 * Validates mobile client configuration safely.
 */
export function validateMobileClientConfig(rawEnv?: Record<string, string | undefined>): MobileClientConfig {
  const envSource = rawEnv || (typeof process !== 'undefined' ? process.env : {});
  const rawData = {
    EXPO_PUBLIC_SUPABASE_URL: envSource.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: envSource.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_API_URL: envSource.EXPO_PUBLIC_API_URL || undefined,
  };

  const parsed = MobileClientConfigSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const errorDetails = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : ''}`)
      .join('; ');
    throw new Error(`[NNOO Config Error] Mobile client configuration validation failed: ${errorDetails}`);
  }

  return parsed.data;
}

/**
 * Ensures Paystack secret key mode strictly aligns with the runtime environment.
 * Prevents test keys in production or live keys in development.
 */
export function assertPaystackEnvironment(
  env: NnooEnvironment,
  secretKey?: string,
  declaredEnv?: string
): { valid: boolean; error?: string } {
  if (!secretKey) {
    return { valid: true }; // Not configured is handled by feature-level guards
  }

  const isTestKey = secretKey.startsWith('sk_test_');
  const isLiveKey = secretKey.startsWith('sk_live_');

  if (env === 'production') {
    if (isTestKey) {
      return {
        valid: false,
        error: 'Production environment cannot use a Paystack test key (sk_test_*)',
      };
    }
    if (declaredEnv === 'test') {
      return {
        valid: false,
        error: 'Production environment cannot be set to PAYSTACK_ENVIRONMENT=test',
      };
    }
  }

  if (env === 'development' || env === 'test') {
    if (isLiveKey) {
      return {
        valid: false,
        error: `${env} environment cannot use a Paystack live key (sk_live_*) to prevent accidental live billing`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates that Mobile production does not point to development backend.
 */
export function assertMobileBackendMatches(
  env: NnooEnvironment,
  supabaseUrl: string
): { valid: boolean; error?: string } {
  if (env === 'production') {
    if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
      return {
        valid: false,
        error: 'Production mobile client cannot point to localhost Supabase instance',
      };
    }
  }
  return { valid: true };
}

/**
 * Evaluates safe provider readiness without leaking credentials.
 */
export function getPlatformProviderStatus(config: ServerConfig): PlatformProviderStatus {
  return {
    environment: config.NNOO_ENV,
    supabase: {
      configured: Boolean(config.NEXT_PUBLIC_SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY),
      status: 'CONFIGURED',
    },
    paystack: {
      configured: Boolean(config.PAYSTACK_SECRET_KEY),
      status: config.PAYSTACK_SECRET_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
      environment: config.PAYSTACK_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test',
    },
    gemini: {
      configured: Boolean(config.GEMINI_API_KEY),
      status: !config.AI_ENABLED ? 'DISABLED' : config.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
      details: config.GEMINI_MODEL_DEFAULT,
    },
    whatsapp: {
      configured: Boolean(config.WHATSAPP_ACCESS_TOKEN && config.WHATSAPP_PHONE_NUMBER_ID),
      status: !config.WHATSAPP_ENABLED ? 'DISABLED' : (config.WHATSAPP_ACCESS_TOKEN ? 'CONFIGURED' : 'NOT_CONFIGURED'),
      environment: config.WHATSAPP_PROVIDER,
    },
    inngest: {
      configured: Boolean(config.INNGEST_EVENT_KEY && config.INNGEST_SIGNING_KEY),
      status: (config.INNGEST_EVENT_KEY && config.INNGEST_SIGNING_KEY) ? 'CONFIGURED' : 'NOT_CONFIGURED',
    },
    push: {
      configured: Boolean(config.EXPO_ACCESS_TOKEN),
      status: config.EXPO_ACCESS_TOKEN ? 'CONFIGURED' : 'NOT_CONFIGURED',
    },
  };
}
