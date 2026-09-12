import 'server-only';
import type { AIErrorCode, AISafeError } from '@nnoo/contracts';

/**
 * Validates and sanitizes text inputs for AI requests.
 * Preserves legitimate business names and notes without destructive alteration,
 * while neutralizing boundary injection attempts.
 */
export function sanitizeAIInput(
  input: string,
  maxLength: number = 4000
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Check length bounds before expensive processing
  if (input.length > maxLength) {
    throw {
      code: 'AI_INVALID_INPUT' as AIErrorCode,
      message: `Input exceeds maximum allowed length of ${maxLength} characters.`,
      retryable: false,
    } satisfies AISafeError;
  }

  // Remove null bytes and control characters except newlines/tabs
  let sanitized = input.replace(/\0/g, '').replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Escape boundary delimiters to prevent prompt jailbreaking
  sanitized = sanitized
    .replace(/<untrusted_user_input>/gi, '&lt;untrusted_user_input&gt;')
    .replace(/<\/untrusted_user_input>/gi, '&lt;/untrusted_user_input&gt;')
    .replace(/\[VERIFIED BUSINESS CONTEXT/gi, '\\[VERIFIED BUSINESS CONTEXT')
    .replace(/\[FEATURE INSTRUCTIONS/gi, '\\[FEATURE INSTRUCTIONS')
    .replace(/\[SYSTEM SECURITY POLICY/gi, '\\[SYSTEM SECURITY POLICY');

  return sanitized.trim();
}
