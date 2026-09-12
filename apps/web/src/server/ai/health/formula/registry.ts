import 'server-only';
import { BusinessHealthFormulaV1 } from './v1';

export interface HealthFormulaDefinition {
  version: string;
  name: string;
  isCurrent: boolean;
}

export const HEALTH_FORMULA_REGISTRY: Record<string, HealthFormulaDefinition> = {
  'business-health-score-v1': {
    version: 'business-health-score-v1',
    name: 'NNOO Business Health Score v1',
    isCurrent: true,
  },
};

export class HealthFormulaRegistry {
  public static getCurrentFormulaVersion(): string {
    return BusinessHealthFormulaV1.FORMULA_VERSION;
  }

  public static isSupportedVersion(version: string): boolean {
    return Boolean(HEALTH_FORMULA_REGISTRY[version]);
  }
}
