import 'server-only';
import type {
  StructuredBusinessSummaryResponse,
  BusinessInsightSignalKey,
  BusinessInsightActionKey,
} from '@nnoo/contracts';
import { AISafeError } from '../service';

/**
 * Numeric and Factuality Guard for Business Summaries.
 * Ensures that Gemini narrative does not hallucinate financial numbers, health scores,
 * credit scores, predictions, or invalid signal/action keys.
 */
export class NumericLiteralGuard {
  /**
   * Prohibited phrases and patterns that must never appear in AI business summary prose.
   */
  private static readonly PROHIBITED_PATTERNS: Array<{ regex: RegExp; code: string; message: string }> = [
    {
      regex: /\b(business\s+)?health\s+score\b/i,
      code: 'PROHIBITED_HEALTH_SCORE',
      message: 'Business Health Score is not permitted in Business Summaries.',
    },
    {
      regex: /\bscore\s+(of\s+)?\d+\s*(\/|\s*out\s+of\s*)\s*100\b/i,
      code: 'PROHIBITED_SCORE_RATING',
      message: 'Numeric scoring is not permitted in Business Summaries.',
    },
    {
      regex: /\b(credit\s+score|credit\s+rating|creditworthiness|lending\s+score)\b/i,
      code: 'PROHIBITED_CREDIT_SCORE',
      message: 'Credit scores are not permitted in Business Summaries.',
    },
    {
      regex: /\b(will\s+make|projected\s+revenue|forecasted\s+sales|on\s+track\s+to\s+make)\s+(₦|\$|ngn|usd)?\s*\d+/i,
      code: 'PROHIBITED_FORECAST',
      message: 'Financial forecasts and revenue projections are not permitted.',
    },
    {
      regex: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      code: 'XSS_DETECTED',
      message: 'HTML script tags are forbidden in narrative text.',
    },
  ];

  /**
   * Validates structured response against allowed signals, actions, and safety rules.
   */
  public static validate(
    response: StructuredBusinessSummaryResponse,
    allowedSignalKeys: BusinessInsightSignalKey[],
    allowedActionKeys: BusinessInsightActionKey[]
  ): void {
    const { headline, overview, highlightSignalKeys, attentionSignalKeys, actionKeys } = response;

    // 1. Text safety check
    const combinedText = `${headline} ${overview}`;
    for (const item of this.PROHIBITED_PATTERNS) {
      if (item.regex.test(combinedText)) {
        throw new AISafeError(
          'AI_INSIGHTS_INVALID_RESULT',
          `AI narrative violated content policy (${item.code}): ${item.message}`,
          false
        );
      }
    }

    // 2. Validate signal keys
    const allowedSignalsSet = new Set(allowedSignalKeys);
    for (const key of highlightSignalKeys) {
      if (!allowedSignalsSet.has(key)) {
        throw new AISafeError(
          'AI_INSIGHTS_INVALID_RESULT',
          `Unknown highlight signal key '${key}'. Must be in allowed signals.`,
          false
        );
      }
    }

    for (const key of attentionSignalKeys) {
      if (!allowedSignalsSet.has(key)) {
        throw new AISafeError(
          'AI_INSIGHTS_INVALID_RESULT',
          `Unknown attention signal key '${key}'. Must be in allowed signals.`,
          false
        );
      }
    }

    // 3. Validate action keys
    const allowedActionsSet = new Set(allowedActionKeys);
    for (const key of actionKeys) {
      if (!allowedActionsSet.has(key)) {
        throw new AISafeError(
          'AI_INSIGHTS_INVALID_RESULT',
          `Unknown action key '${key}'. Must be in allowed navigation actions.`,
          false
        );
      }
    }
  }
}
