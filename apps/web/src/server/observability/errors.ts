import 'server-only';

export type NNOOErrorCode =
  | 'AUTH_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'BUSINESS_SUSPENDED'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'DATABASE_UNAVAILABLE'
  | 'PAYSTACK_UNAVAILABLE'
  | 'PAYSTACK_VERIFICATION_FAILED'
  | 'GEMINI_UNAVAILABLE'
  | 'GEMINI_RATE_LIMITED'
  | 'JOB_FAILED'
  | 'PUSH_DELIVERY_FAILED'
  | 'WHATSAPP_DELIVERY_FAILED'
  | 'STORAGE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface UserFacingErrorResponse {
  success: false;
  error: {
    code: NNOOErrorCode;
    message: string;
    correlationId: string;
    retryable: boolean;
  };
}

/**
 * Standard user-friendly error messages mapped to error codes.
 * Ensures internal details (table names, SQL errors, provider tokens) are never displayed to end users.
 */
const USER_FACING_ERROR_MESSAGES: Record<NNOOErrorCode, string> = {
  AUTH_REQUIRED: 'Authentication required. Please sign in to continue.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  BUSINESS_SUSPENDED: 'This business account is currently suspended. Please contact support.',
  VALIDATION_FAILED: 'The provided data is invalid. Please check your inputs and try again.',
  NOT_FOUND: 'The requested resource could not be found.',
  CONFLICT: 'A conflict occurred with an existing record. Please refresh and try again.',
  RATE_LIMITED: 'Too many requests. Please slow down and try again shortly.',
  DATABASE_UNAVAILABLE: 'We are experiencing temporary service disruption. Please try again in a few moments.',
  PAYSTACK_UNAVAILABLE: 'Payment provider is currently unavailable. Your payment was not processed.',
  PAYSTACK_VERIFICATION_FAILED: 'Payment verification could not be completed. Please contact support.',
  GEMINI_UNAVAILABLE: 'AI intelligence is temporarily unavailable. Core business features remain functional.',
  GEMINI_RATE_LIMITED: 'AI processing quota reached. Please retry in a few moments.',
  JOB_FAILED: 'Background processing encountered an issue. It will be retried automatically.',
  PUSH_DELIVERY_FAILED: 'Push notification could not be delivered to device.',
  WHATSAPP_DELIVERY_FAILED: 'WhatsApp message delivery failed. Please check your notification preferences.',
  STORAGE_UNAVAILABLE: 'Document storage is temporarily unavailable. Please try again shortly.',
  INTERNAL_ERROR: 'An unexpected error occurred. Our team has been notified.',
};

/**
 * Canonical Application Safe Error class.
 */
export class NNOOSafeError extends Error {
  public readonly code: NNOOErrorCode;
  public readonly retryable: boolean;
  public readonly correlationId?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: NNOOErrorCode,
    customInternalMessage?: string,
    retryable: boolean = false,
    correlationId?: string,
    details?: Record<string, unknown>
  ) {
    super(customInternalMessage || USER_FACING_ERROR_MESSAGES[code] || 'Internal error');
    this.name = 'NNOOSafeError';
    this.code = code;
    this.retryable = retryable;
    this.correlationId = correlationId;
    this.details = details;
    Object.setPrototypeOf(this, NNOOSafeError.prototype);
  }

  /**
   * Formats the error into a safe client response with correlation ID.
   */
  public toUserFacingJSON(fallbackCorrelationId?: string): UserFacingErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: USER_FACING_ERROR_MESSAGES[this.code] || 'An unexpected error occurred.',
        correlationId: this.correlationId || fallbackCorrelationId || 'nnoo_corr_unassigned',
        retryable: this.retryable,
      },
    };
  }
}

/**
 * Normalizes any unknown error into a secure UserFacingErrorResponse.
 */
export function normalizeToUserFacingError(
  error: unknown,
  correlationId: string
): UserFacingErrorResponse {
  if (error instanceof NNOOSafeError) {
    return error.toUserFacingJSON(correlationId);
  }

  const errStr = error instanceof Error ? error.message : String(error);
  const errLower = errStr.toLowerCase();

  // Classify common infrastructure / database errors
  if (errLower.includes('jwt') || errLower.includes('auth')) {
    return new NNOOSafeError('AUTH_REQUIRED', errStr, false, correlationId).toUserFacingJSON(correlationId);
  }

  if (errLower.includes('permission') || errLower.includes('row-level security') || errLower.includes('rls')) {
    return new NNOOSafeError('PERMISSION_DENIED', errStr, false, correlationId).toUserFacingJSON(correlationId);
  }

  if (
    errLower.includes('econnrefused') ||
    errLower.includes('fetch failed') ||
    errLower.includes('database') ||
    errLower.includes('connection refused') ||
    errLower.includes('connection to server')
  ) {
    return new NNOOSafeError('DATABASE_UNAVAILABLE', errStr, true, correlationId).toUserFacingJSON(correlationId);
  }

  return new NNOOSafeError('INTERNAL_ERROR', errStr, false, correlationId).toUserFacingJSON(correlationId);
}
