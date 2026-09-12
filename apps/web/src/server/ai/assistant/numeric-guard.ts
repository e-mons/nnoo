import {
  type StructuredAskNnooResponse,
  type AskNnooSourceKey,
  type AskNnooActionKey,
  ASK_NNOO_ACTION_REGISTRY,
} from '@nnoo/contracts';
import { AISafeError } from '../service';

export class AskNnooNumericGuard {
  private static readonly PROHIBITED_PATTERNS = [
    // Prohibited Health Score (Prompt 6 ownership)
    /\b(?:health\s*score|score\s*of)\s*:\s*\d{1,3}(?:\s*\/\s*100)?\b/i,
    /\b\d{1,3}\s*\/\s*100\b/i,
    // Prohibited Credit Rating / Loan qualification (Prompt 7 ownership)
    /\b(?:credit\s*score|credit\s*rating|loan\s*eligibility|qualif(?:y|ies|ied)\s*for\s*(?:a\s*)?loan)\b/i,
    // Prohibited Forecasting & Projections
    /\b(?:next\s*month(?:'s)?\s*sales\s*will\s*be|forecast(?:ed|ing)?\s*revenue|predict(?:ed|ing)?\s*that\s*you\s*will\s*make|on\s*track\s*to\s*hit\s*₦)\b/i,
    // Prohibited Tax liability invention
    /\b(?:you\s*owe\s*₦\s*\d+|your\s*tax\s*liability\s*is\s*₦)\b/i,
  ];

  /**
   * Validates structured response against hallucinated numbers, unapproved keys, and prohibited content.
   */
  public static validate(
    response: StructuredAskNnooResponse,
    availableFactKeys: Set<string>,
    availableEntityKeys: Set<string>,
    allowedSourceKeys: Set<AskNnooSourceKey>,
    allowableActionKeys: Set<AskNnooActionKey>
  ): void {
    // 1. Fact Key Allowlist
    for (const key of response.factKeys || []) {
      if (!availableFactKeys.has(key)) {
        throw new AISafeError(
          'ASK_NNOO_INVALID_RESPONSE',
          `Model output referenced unknown or unauthorized factKey '${key}'.`,
          false
        );
      }
    }

    // 2. Entity Key Allowlist
    for (const key of response.entityKeys || []) {
      if (!availableEntityKeys.has(key)) {
        throw new AISafeError(
          'ASK_NNOO_INVALID_RESPONSE',
          `Model output referenced unknown entityKey '${key}'.`,
          false
        );
      }
    }

    // 3. Source Key Allowlist
    for (const key of response.sourceKeys || []) {
      if (!allowedSourceKeys.has(key)) {
        throw new AISafeError(
          'ASK_NNOO_INVALID_RESPONSE',
          `Model output referenced unretrieved sourceKey '${key}'.`,
          false
        );
      }
    }

    // 4. Action Key Allowlist
    for (const key of response.actionKeys || []) {
      if (!allowableActionKeys.has(key) && !ASK_NNOO_ACTION_REGISTRY[key]) {
        throw new AISafeError(
          'ASK_NNOO_INVALID_RESPONSE',
          `Model output referenced invalid actionKey '${key}'.`,
          false
        );
      }
    }

    // 5. Inspect segments
    for (const seg of response.segments || []) {
      if (seg.type === 'FACT') {
        if (!seg.factKey || !availableFactKeys.has(seg.factKey)) {
          throw new AISafeError(
            'ASK_NNOO_INVALID_RESPONSE',
            `FACT segment referenced missing or unauthorized factKey '${seg.factKey}'.`,
            false
          );
        }
      } else if (seg.type === 'SAFE_ENTITY_LABEL') {
        if (!seg.entityKey || !availableEntityKeys.has(seg.entityKey)) {
          throw new AISafeError(
            'ASK_NNOO_INVALID_RESPONSE',
            `SAFE_ENTITY_LABEL segment referenced unauthorized entityKey '${seg.entityKey}'.`,
            false
          );
        }
      } else if (seg.type === 'TEXT') {
        const text = seg.text || '';
        // Check for prohibited content patterns
        for (const pattern of this.PROHIBITED_PATTERNS) {
          if (pattern.test(text)) {
            throw new AISafeError(
              'ASK_NNOO_INVALID_RESPONSE',
              `Model output contained prohibited content matching pattern ${pattern}.`,
              false
            );
          }
        }
      }
    }

    // 6. Inspect headline
    if (response.headline) {
      for (const pattern of this.PROHIBITED_PATTERNS) {
        if (pattern.test(response.headline)) {
          throw new AISafeError(
            'ASK_NNOO_INVALID_RESPONSE',
            `Model headline contained prohibited content matching pattern ${pattern}.`,
            false
          );
        }
      }
    }
  }
}
