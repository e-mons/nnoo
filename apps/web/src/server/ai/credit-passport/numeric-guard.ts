import 'server-only';
import {
  CreditPassportHighlightKeySchema,
  CreditPassportAttentionKeySchema,
} from '@nnoo/validation';
import type {
  CreditPassportExplanation,
  CreditPassportHighlightKey,
  CreditPassportAttentionKey,
} from '@nnoo/contracts';
import { AISafeError } from '../service';

/**
 * Post-validation guard for Credit Passport AI explanations.
 * Prohibits credit scores, loan approvals, bank ratings, audit claims, and ungrounded statements.
 */
export class CreditPassportNumericGuard {
  private static readonly PROHIBITED_PHRASES = [
    /qualif(?:y|ies|ied)\s+for\s+(?:a\s+)?loan/i,
    /loan\s+approval/i,
    /approve\s+your\s+loan/i,
    /lenders?\s+will\s+approve/i,
    /creditworthy/i,
    /bankable/i,
    /credit\s+score\s+(?:is\s+|of\s+)?\d+/i,
    /credit\s+rating/i,
    /borrow\s+(?:₦|NGN|N|\$)\s*[\d,]+/i,
    /recommended\s+loan/i,
    /loan\s+amount/i,
    /loan\s+tenor/i,
    /interest\s+rate\s+of/i,
    /default\s+(?:probability|risk)/i,
    /audited\s+financial/i,
    /independently\s+audited/i,
    /government\s+verified/i,
    /bank\s+verified/i,
    /tax\s+(?:liability|owing|payment)\s+of/i,
  ];

  /**
   * Validates and sanitizes a structured Credit Passport explanation response.
   */
  public static validateAndGuard(rawExplanation: {
    headline: string;
    overview: string;
    highlightKeys: string[];
    attentionKeys: string[];
    promptVersion: string;
    responseSchemaVersion: string;
    modelId: string;
    createdAt: string;
  }): CreditPassportExplanation {
    const combinedText = `${rawExplanation.headline} ${rawExplanation.overview}`;

    for (const pattern of this.PROHIBITED_PHRASES) {
      if (pattern.test(combinedText)) {
        throw new AISafeError(
          'CREDIT_PASSPORT_EXPLANATION_INVALID',
          `AI explanation contained prohibited credit score, loan, or audit claim matching pattern: ${pattern.source}`,
          false
        );
      }
    }

    // Filter highlight keys against the allowlist schema
    const validHighlightKeys: CreditPassportHighlightKey[] = [];
    for (const key of rawExplanation.highlightKeys) {
      const parsed = CreditPassportHighlightKeySchema.safeParse(key);
      if (parsed.success && !validHighlightKeys.includes(parsed.data)) {
        validHighlightKeys.push(parsed.data);
      }
    }

    // Filter attention keys against the allowlist schema
    const validAttentionKeys: CreditPassportAttentionKey[] = [];
    for (const key of rawExplanation.attentionKeys) {
      const parsed = CreditPassportAttentionKeySchema.safeParse(key);
      if (parsed.success && !validAttentionKeys.includes(parsed.data)) {
        validAttentionKeys.push(parsed.data);
      }
    }

    return {
      headline: rawExplanation.headline.trim(),
      overview: rawExplanation.overview.trim(),
      highlightKeys: validHighlightKeys,
      attentionKeys: validAttentionKeys,
      promptVersion: rawExplanation.promptVersion,
      responseSchemaVersion: rawExplanation.responseSchemaVersion,
      modelId: rawExplanation.modelId,
      createdAt: rawExplanation.createdAt,
    };
  }
}
