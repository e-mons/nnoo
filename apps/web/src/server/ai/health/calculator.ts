import 'server-only';
import type { BusinessHealthScoreResult } from '@nnoo/contracts';
import { BusinessHealthFormulaV1, type HealthScoreRawInputs } from './formula/v1';

/**
 * Deterministic Business Health Score Calculator Orchestrator.
 * Pure TypeScript logic. ZERO @google/genai imports. ZERO AI dependencies.
 */
export class BusinessHealthCalculator {
  /**
   * Computes the deterministic Business Health Score result.
   */
  public static calculate(inputs: HealthScoreRawInputs): BusinessHealthScoreResult {
    return BusinessHealthFormulaV1.calculate(inputs);
  }
}
