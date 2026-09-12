import 'server-only';
import type { AIErrorCode, AISafeError } from '@nnoo/contracts';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

class AIRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();
  private readonly maxRequestsPerMinute: number;
  private readonly windowMs: number;

  constructor(maxRequestsPerMinute: number = 30, windowMs: number = 60000) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.windowMs = windowMs;
  }

  checkRateLimit(key: string, limitOverride?: number): void {
    const now = Date.now();
    const limit = limitOverride ?? this.maxRequestsPerMinute;

    const bucket = this.buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return;
    }

    if (bucket.count >= limit) {
      const waitSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      throw {
        code: 'AI_RATE_LIMITED' as AIErrorCode,
        message: `AI request limit reached. Please wait ${waitSeconds} seconds before trying again.`,
        retryable: true,
        details: { resetInSeconds: waitSeconds },
      } satisfies AISafeError;
    }

    bucket.count++;
  }

  reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }
}

export const globalAIRateLimiter = new AIRateLimiter();
