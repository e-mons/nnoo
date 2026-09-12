import 'server-only';

/**
 * Scrubs sensitive tokens, passwords, API keys, and service secrets from log messages.
 */
export function redactSecrets(message: string): string {
  if (!message || typeof message !== 'string') return '';

  return message
    .replace(/(AIza[0-9A-Za-z-_]{20,})/g, '[REDACTED_GEMINI_KEY]')
    .replace(/(sbp_[0-9a-f]{40})/gi, '[REDACTED_SUPABASE_TOKEN]')
    .replace(/(sk_test_[0-9a-zA-Z]{24,})/gi, '[REDACTED_PAYSTACK_KEY]')
    .replace(/(sk_live_[0-9a-zA-Z]{24,})/gi, '[REDACTED_PAYSTACK_KEY]')
    .replace(/(Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/gi, 'Bearer [REDACTED_JWT]')
    .replace(/("password":\s*)"[^"]+"/gi, '$1"[REDACTED]"')
    .replace(/("secret":\s*)"[^"]+"/gi, '$1"[REDACTED]"');
}

export const aiLogger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'test') {
      const sanitizedMeta = meta ? JSON.parse(redactSecrets(JSON.stringify(meta))) : undefined;
      console.log(`[AI INFO] ${redactSecrets(message)}`, sanitizedMeta ?? '');
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'test') {
      const sanitizedMeta = meta ? JSON.parse(redactSecrets(JSON.stringify(meta))) : undefined;
      console.warn(`[AI WARN] ${redactSecrets(message)}`, sanitizedMeta ?? '');
    }
  },
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      let errString = '';
      if (error instanceof Error) {
        errString = error.stack || error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errString = (error as any).message || (error as any).code || JSON.stringify(error);
        } catch {
          errString = String(error);
        }
      } else {
        errString = String(error ?? '');
      }
      console.error(`[AI ERROR] ${redactSecrets(message)} - ${redactSecrets(errString)}`);
    }
  },
};
