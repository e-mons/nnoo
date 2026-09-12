import 'server-only';
import { randomBytes } from 'crypto';

export interface CorrelationContext {
  correlationId: string;
  requestId?: string;
  businessId?: string;
  userId?: string;
  operationName?: string;
  source?: string;
  timestamp: string;
}

/**
 * Generates a cryptographically random, collision-resistant correlation identifier.
 * Format: `nnoo_corr_<hex16>` or custom prefix.
 */
export function generateCorrelationId(prefix: string = 'nnoo_corr'): string {
  const rand = randomBytes(8).toString('hex');
  return `${prefix}_${rand}`;
}

/**
 * Generates an HTTP request identifier.
 * Format: `req_<hex8>`
 */
export function generateRequestId(): string {
  const rand = randomBytes(4).toString('hex');
  return `req_${rand}`;
}

/**
 * Validates whether a client-provided correlation ID adheres to safe formatting bounds.
 * Prevents log-injection or buffer-overflow attempts via oversized headers.
 */
export function sanitizeClientCorrelationId(rawId?: string | null): string {
  if (!rawId || typeof rawId !== 'string') {
    return generateCorrelationId();
  }

  const trimmed = rawId.trim();
  // Allow alphanumeric, underscores, hyphens up to 64 chars
  if (/^[a-zA-Z0-9_-]{8,64}$/.test(trimmed)) {
    return trimmed;
  }

  return generateCorrelationId();
}

/**
 * Builds a traceable execution context for an asynchronous or multi-step workflow.
 */
export function createCorrelationContext(params: {
  correlationId?: string;
  requestId?: string;
  businessId?: string;
  userId?: string;
  operationName?: string;
  source?: string;
}): CorrelationContext {
  return {
    correlationId: params.correlationId || generateCorrelationId(),
    requestId: params.requestId || generateRequestId(),
    businessId: params.businessId,
    userId: params.userId,
    operationName: params.operationName,
    source: params.source,
    timestamp: new Date().toISOString(),
  };
}
