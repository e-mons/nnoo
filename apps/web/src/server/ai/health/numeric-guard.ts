import 'server-only';
import type {
  BusinessHealthExplanation,
  BusinessHealthScoreBand,
  BusinessHealthReasonKey,
  BusinessHealthActionKey,
} from '@nnoo/contracts';
import { AISafeError } from '../service';

export interface ExplanationGuardContext {
  deterministicScore: number | null;
  deterministicBand: BusinessHealthScoreBand | null;
  allowedReasonKeys: BusinessHealthReasonKey[];
  allowedActionKeys: BusinessHealthActionKey[];
}

export class HealthScoreNumericGuard {
  private static readonly PROHIBITED_CREDIT_PATTERNS = [
    /\b(?:credit\s*score|credit\s*rating|creditworthiness|creditworthy|loan\s*eligibility|qualif(?:y|ies|ied)\s*for\s*(?:a\s*)?loan|bankable|bank\s*approval)\b/i,
  ];

  private static readonly PROHIBITED_FORECAST_PATTERNS = [
    /\b(?:next\s*month(?:'s)?\s*sales\s*will\s*be|forecast(?:ed|ing)?\s*revenue|predict(?:ed|ing)?\s*that\s*you\s*will\s*make|on\s*track\s*to\s*hit\s*₦)\b/i,
  ];

  private static readonly PROHIBITED_TAX_PATTERNS = [
    /\b(?:you\s*owe\s*₦\s*\d+|your\s*tax\s*liability\s*is\s*₦)\b/i,
  ];

  /**
   * Validates and sanitizes a structured Gemini health score explanation.
   */
  public static validateExplanation(
    explanation: Partial<BusinessHealthExplanation>,
    context: ExplanationGuardContext
  ): {
    headline: string;
    overview: string;
    strengthReasonKeys: BusinessHealthReasonKey[];
    attentionReasonKeys: BusinessHealthReasonKey[];
    actionKeys: BusinessHealthActionKey[];
  } {
    const headline = explanation.headline || 'Business Health Overview';
    const overview = explanation.overview || '';

    // 1. Guard against credit score / loan qualification claims
    for (const pattern of this.PROHIBITED_CREDIT_PATTERNS) {
      if (pattern.test(headline) || pattern.test(overview)) {
        throw new AISafeError(
          'BUSINESS_HEALTH_EXPLANATION_INVALID',
          'AI explanation contained prohibited credit score or loan qualification claims.',
          true
        );
      }
    }

    // 2. Guard against revenue forecasting
    for (const pattern of this.PROHIBITED_FORECAST_PATTERNS) {
      if (pattern.test(headline) || pattern.test(overview)) {
        throw new AISafeError(
          'BUSINESS_HEALTH_EXPLANATION_INVALID',
          'AI explanation contained prohibited future revenue forecasts.',
          true
        );
      }
    }

    // 3. Guard against tax liabilities
    for (const pattern of this.PROHIBITED_TAX_PATTERNS) {
      if (pattern.test(headline) || pattern.test(overview)) {
        throw new AISafeError(
          'BUSINESS_HEALTH_EXPLANATION_INVALID',
          'AI explanation contained prohibited tax liability claims.',
          true
        );
      }
    }

    // 4. Guard against model score injection: if model types a conflicting score
    if (context.deterministicScore !== null) {
      const scoreMismatchPattern = new RegExp(`\\b(?!${context.deterministicScore}\\b)\\d{1,3}\\s*\\/\\s*100\\b`, 'i');
      if (scoreMismatchPattern.test(headline) || scoreMismatchPattern.test(overview)) {
        throw new AISafeError(
          'BUSINESS_HEALTH_EXPLANATION_INVALID',
          'AI explanation attempted to inject a score that contradicts the deterministic calculation.',
          true
        );
      }
    }

    // 5. Filter reason keys to allowed set
    const allowedReasonSet = new Set(context.allowedReasonKeys);
    const validStrengthKeys = (explanation.strengthReasonKeys || []).filter((k) =>
      allowedReasonSet.has(k as BusinessHealthReasonKey)
    ) as BusinessHealthReasonKey[];

    const validAttentionKeys = (explanation.attentionReasonKeys || []).filter((k) =>
      allowedReasonSet.has(k as BusinessHealthReasonKey)
    ) as BusinessHealthReasonKey[];

    // 6. Filter action keys to allowed set
    const allowedActionSet = new Set(context.allowedActionKeys);
    const validActionKeys = (explanation.actionKeys || []).filter((k) =>
      allowedActionSet.has(k as BusinessHealthActionKey)
    ) as BusinessHealthActionKey[];

    return {
      headline,
      overview,
      strengthReasonKeys: validStrengthKeys.length > 0 ? validStrengthKeys : context.allowedReasonKeys.slice(0, 3),
      attentionReasonKeys: validAttentionKeys.length > 0 ? validAttentionKeys : context.allowedReasonKeys.slice(0, 3),
      actionKeys: validActionKeys.length > 0 ? validActionKeys : context.allowedActionKeys.slice(0, 3),
    };
  }
}
