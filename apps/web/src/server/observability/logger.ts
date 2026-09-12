import 'server-only';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type LogServiceNamespace =
  | 'web'
  | 'api'
  | 'database'
  | 'ai'
  | 'billing'
  | 'jobs'
  | 'whatsapp'
  | 'push'
  | 'recovery'
  | 'security'
  | 'platform';

export interface StructuredLogEvent {
  timestamp: string;
  level: LogLevel;
  environment: string;
  service: LogServiceNamespace;
  feature: string;
  eventName: string;
  correlationId: string;
  requestId?: string;
  businessRef?: string;
  userRef?: string;
  provider?: string;
  operationRef?: string;
  attempt?: number;
  status: 'SUCCESS' | 'FAILURE' | 'SKIPPED' | 'IN_PROGRESS' | 'RETRYING';
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Scrubs sensitive tokens, passwords, API keys, service secrets, and payment credentials from log strings.
 */
export function redactSecrets(message: string): string {
  if (!message || typeof message !== 'string') return '';

  return message
    // Google Gemini API keys
    .replace(/(AIza[0-9A-Za-z-_]{20,})/g, '[REDACTED_GEMINI_KEY]')
    // Supabase service / personal tokens
    .replace(/(sbp_[0-9a-f]{40})/gi, '[REDACTED_SUPABASE_TOKEN]')
    .replace(/(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g, '[REDACTED_SUPABASE_JWT]')
    // Paystack test and live keys
    .replace(/(sk_test_[0-9a-zA-Z]{20,})/gi, '[REDACTED_PAYSTACK_KEY]')
    .replace(/(sk_live_[0-9a-zA-Z]{20,})/gi, '[REDACTED_PAYSTACK_KEY]')
    .replace(/(pk_test_[0-9a-zA-Z]{20,})/gi, '[REDACTED_PAYSTACK_KEY]')
    .replace(/(pk_live_[0-9a-zA-Z]{20,})/gi, '[REDACTED_PAYSTACK_KEY]')
    // Meta WhatsApp Cloud API access tokens & secrets
    .replace(/(EAAG[0-9A-Za-z_-]{30,})/gi, '[REDACTED_META_TOKEN]')
    .replace(/(whatsapp_verify_[0-9a-zA-Z_-]{10,})/gi, '[REDACTED_WHATSAPP_TOKEN]')
    // Inngest signing & event keys
    .replace(/(signkey-[a-z0-9-]{30,})/gi, '[REDACTED_INNGEST_KEY]')
    // Generic Bearer tokens
    .replace(/(Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/gi, 'Bearer [REDACTED_JWT]')
    // Password & Secret JSON fields
    .replace(/("password":\s*)"[^"]+"/gi, '$1"[REDACTED]"')
    .replace(/("secret":\s*)"[^"]+"/gi, '$1"[REDACTED]"')
    .replace(/("token":\s*)"[^"]+"/gi, '$1"[REDACTED]"')
    .replace(/("apiKey":\s*)"[^"]+"/gi, '$1"[REDACTED]"')
    .replace(/("authorization":\s*)"[^"]+"/gi, '$1"[REDACTED]"');
}

/**
 * Truncates and bounds metadata objects to avoid memory amplification and logging denial-of-service.
 */
export function sanitizeLogMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;

  try {
    const rawJson = JSON.stringify(metadata, (_key, value) => {
      if (typeof value === 'bigint') return value.toString();
      if (value instanceof Error) {
        return {
          name: value.name,
          message: redactSecrets(value.message),
          stack: redactSecrets(value.stack ?? ''),
        };
      }
      if (typeof value === 'string' && value.length > 1000) {
        return value.substring(0, 1000) + '...[TRUNCATED]';
      }
      return value;
    });

    const redactedJson = redactSecrets(rawJson);
    return JSON.parse(redactedJson);
  } catch {
    return { sanitized: true, note: 'Metadata failed serialization' };
  }
}

/**
 * Universal production structured logger.
 * ALWAYS fails open — a logging failure will never crash canonical business operations.
 */
export class StructuredLogger {
  private service: LogServiceNamespace;

  constructor(service: LogServiceNamespace) {
    this.service = service;
  }

  public log(event: Omit<StructuredLogEvent, 'service' | 'timestamp' | 'environment'>): void {
    try {
      const fullEvent: StructuredLogEvent = {
        timestamp: new Date().toISOString(),
        environment: process.env.NNOO_ENV ?? process.env.NODE_ENV ?? 'development',
        service: this.service,
        ...event,
        errorMessage: event.errorMessage ? redactSecrets(event.errorMessage) : undefined,
        metadata: sanitizeLogMetadata(event.metadata),
      };

      const serialized = JSON.stringify(fullEvent);

      if (process.env.NODE_ENV !== 'test') {
        switch (event.level) {
          case 'DEBUG':
            console.debug(serialized);
            break;
          case 'INFO':
            console.log(serialized);
            break;
          case 'WARN':
            console.warn(serialized);
            break;
          case 'ERROR':
            console.error(serialized);
            break;
        }
      }
    } catch {
      // Fail-open: zero impact on caller
    }
  }

  public debug(
    feature: string,
    eventName: string,
    correlationId: string,
    details?: Partial<Omit<StructuredLogEvent, 'level' | 'service' | 'timestamp' | 'environment' | 'feature' | 'eventName' | 'correlationId'>>
  ): void {
    this.log({
      level: 'DEBUG',
      feature,
      eventName,
      correlationId,
      status: details?.status ?? 'SUCCESS',
      ...details,
    });
  }

  public info(
    feature: string,
    eventName: string,
    correlationId: string,
    details?: Partial<Omit<StructuredLogEvent, 'level' | 'service' | 'timestamp' | 'environment' | 'feature' | 'eventName' | 'correlationId'>>
  ): void {
    this.log({
      level: 'INFO',
      feature,
      eventName,
      correlationId,
      status: details?.status ?? 'SUCCESS',
      ...details,
    });
  }

  public warn(
    feature: string,
    eventName: string,
    correlationId: string,
    details?: Partial<Omit<StructuredLogEvent, 'level' | 'service' | 'timestamp' | 'environment' | 'feature' | 'eventName' | 'correlationId'>>
  ): void {
    this.log({
      level: 'WARN',
      feature,
      eventName,
      correlationId,
      status: details?.status ?? 'FAILURE',
      ...details,
    });
  }

  public error(
    feature: string,
    eventName: string,
    correlationId: string,
    error: unknown,
    details?: Partial<Omit<StructuredLogEvent, 'level' | 'service' | 'timestamp' | 'environment' | 'feature' | 'eventName' | 'correlationId' | 'errorMessage'>>
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    this.log({
      level: 'ERROR',
      feature,
      eventName,
      correlationId,
      status: 'FAILURE',
      errorMessage,
      ...details,
    });
  }
}

export const appLogger = new StructuredLogger('platform');
export const apiLogger = new StructuredLogger('api');
export const dbLogger = new StructuredLogger('database');
export const billingLogger = new StructuredLogger('billing');
export const jobLogger = new StructuredLogger('jobs');
export const messagingLogger = new StructuredLogger('whatsapp');
export const pushLogger = new StructuredLogger('push');
