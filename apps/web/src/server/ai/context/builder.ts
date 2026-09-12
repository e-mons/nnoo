import 'server-only';
import type { VerifiedFactEnvelope } from '@nnoo/contracts';

export interface CreateEnvelopeParams<T> {
  source: string;
  data: T;
  businessId?: string;
  schemaVersion?: string;
}

/**
 * Creates a verified, deterministic data envelope for AI consumption.
 */
export function createVerifiedFactEnvelope<T>(
  params: CreateEnvelopeParams<T>
): VerifiedFactEnvelope<T> {
  return {
    schemaVersion: params.schemaVersion || '1.0.0',
    businessId: params.businessId,
    generatedAt: new Date().toISOString(),
    source: params.source,
    data: params.data,
  };
}

/**
 * Strips PII and sensitive internal fields (passwords, tokens, phone numbers, emails, service keys)
 * from business objects before sending to AI context, ensuring strict data minimization.
 */
export function projectSafeContextData<T extends Record<string, unknown>>(
  input: T,
  allowedPIIFields: string[] = []
): Record<string, unknown> {
  const sensitiveKeys = new Set([
    'password',
    'password_hash',
    'token',
    'token_hash',
    'secret',
    'api_key',
    'bvn',
    'nin',
    'service_role',
    'phone',
    'email',
    'address_line_1',
    'address_line_2',
  ]);

  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const lowerKey = key.toLowerCase();

    // If key is sensitive and not explicitly allowed, omit it
    if (sensitiveKeys.has(lowerKey) && !allowedPIIFields.includes(key)) {
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = projectSafeContextData(value as Record<string, unknown>, allowedPIIFields);
    } else if (Array.isArray(value)) {
      output[key] = value.map((item) =>
        item && typeof item === 'object'
          ? projectSafeContextData(item as Record<string, unknown>, allowedPIIFields)
          : item
      );
    } else {
      output[key] = value;
    }
  }

  return output;
}
