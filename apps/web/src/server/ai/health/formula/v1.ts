import 'server-only';
import type {
  BusinessHealthDimensionKey,
  BusinessHealthDimensionResult,
  BusinessHealthScoreBand,
  BusinessHealthScoreStatus,
  BusinessHealthScoreResult,
  BusinessHealthReasonKey,
  BusinessHealthActionKey,
  BusinessHealthDataCoverage,
} from '@nnoo/contracts';

export interface HealthScoreRawInputs {
  // Sales & Profitability (minor units or numbers)
  netSalesMinor: number;
  grossSalesMinor: number;
  cogsMinor: number;
  grossProfitMinor: number;
  operatingExpensesMinor: number;
  operatingResultMinor: number;
  salesCount: number;

  // Receivables & Payables
  totalReceivablesMinor: number;
  overdueInvoicesCount: number;
  totalPayablesMinor: number;

  // Inventory
  trackedProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;

  // Context & Metadata
  dataCoverage: BusinessHealthDataCoverage;
  evaluationPeriod: {
    start: string;
    end: string;
  };
  asOfTimestamp: string;
  businessTimezone: string;
  currencyCode: string;
  sourceFingerprint: string;
}

export interface DimensionConfig {
  key: BusinessHealthDimensionKey;
  name: string;
  baseWeight: number;
}

export const V1_DIMENSION_CONFIGS: Record<BusinessHealthDimensionKey, DimensionConfig> = {
  SALES_PROFITABILITY: {
    key: 'SALES_PROFITABILITY',
    name: 'Sales & Profitability',
    baseWeight: 30,
  },
  OPERATING_EFFICIENCY: {
    key: 'OPERATING_EFFICIENCY',
    name: 'Operating Efficiency',
    baseWeight: 25,
  },
  RECEIVABLES_COLLECTION: {
    key: 'RECEIVABLES_COLLECTION',
    name: 'Receivables & Collection',
    baseWeight: 20,
  },
  BUSINESS_OBLIGATIONS: {
    key: 'BUSINESS_OBLIGATIONS',
    name: 'Business Obligations',
    baseWeight: 15,
  },
  INVENTORY_READINESS: {
    key: 'INVENTORY_READINESS',
    name: 'Inventory Readiness',
    baseWeight: 10,
  },
};

/**
 * Deterministic business-health-score-v1 calculation engine.
 * Pure TypeScript logic. ZERO @google/genai imports. ZERO AI dependencies.
 */
export class BusinessHealthFormulaV1 {
  public static readonly FORMULA_VERSION = 'business-health-score-v1';

  /**
   * Calculates the full deterministic business health score from raw inputs.
   */
  public static calculate(inputs: HealthScoreRawInputs): BusinessHealthScoreResult {
    // 1. Check for insufficient data
    if (inputs.dataCoverage === 'INSUFFICIENT' || (inputs.netSalesMinor === 0 && inputs.operatingExpensesMinor === 0 && inputs.salesCount === 0)) {
      return {
        formulaVersion: this.FORMULA_VERSION,
        status: 'INSUFFICIENT_DATA',
        score: null,
        scoreBand: null,
        dataCoverage: 'INSUFFICIENT',
        evaluationPeriod: inputs.evaluationPeriod,
        asOfTimestamp: inputs.asOfTimestamp,
        businessTimezone: inputs.businessTimezone,
        currencyCode: inputs.currencyCode,
        sourceFingerprint: inputs.sourceFingerprint,
        applicableDimensionKeys: ['SALES_PROFITABILITY', 'OPERATING_EFFICIENCY', 'RECEIVABLES_COLLECTION', 'BUSINESS_OBLIGATIONS'],
        dimensions: [],
        strengthReasonKeys: [],
        attentionReasonKeys: ['DATA_COVERAGE_INSUFFICIENT'],
        actionKeys: ['OPEN_SALES_REPORT', 'OPEN_EXPENSE_REPORT'],
      };
    }

    // 2. Compute individual dimensions
    const dim1 = this.calculateSalesProfitability(inputs);
    const dim2 = this.calculateOperatingEfficiency(inputs);
    const dim3 = this.calculateReceivables(inputs);
    const dim4 = this.calculatePayables(inputs);
    const dim5 = this.calculateInventory(inputs);

    const allDimensions = [dim1, dim2, dim3, dim4, dim5];
    const applicableDimensions = allDimensions.filter((d) => d.status !== 'NOT_APPLICABLE');

    // 3. Compute weighted final score
    let totalWeightedScore = 0;
    let totalAppliedWeight = 0;

    for (const dim of applicableDimensions) {
      if (dim.score !== null) {
        totalWeightedScore += dim.score * dim.appliedWeight;
        totalAppliedWeight += dim.appliedWeight;
      }
    }

    const finalScore = totalAppliedWeight > 0
      ? Math.max(0, Math.min(100, Math.round(totalWeightedScore / totalAppliedWeight)))
      : 0;

    // 4. Derive score band
    const scoreBand = this.deriveScoreBand(finalScore);

    // 5. Aggregate strength and attention reasons
    const allStrengthReasons: BusinessHealthReasonKey[] = [];
    const allAttentionReasons: BusinessHealthReasonKey[] = [];
    const actionKeysSet = new Set<BusinessHealthActionKey>();

    for (const dim of allDimensions) {
      for (const reason of dim.reasonKeys) {
        if (this.isStrengthReason(reason)) {
          allStrengthReasons.push(reason);
        } else if (this.isAttentionReason(reason)) {
          allAttentionReasons.push(reason);
        }
      }
    }

    // 6. Aggregate recommended action navigation keys
    if (dim1.score !== null && dim1.score < 70) {
      actionKeysSet.add('OPEN_PROFITABILITY_REPORT');
      actionKeysSet.add('OPEN_SALES_REPORT');
    }
    if (dim2.score !== null && dim2.score < 70) {
      actionKeysSet.add('OPEN_EXPENSE_REPORT');
    }
    if (dim3.score !== null && dim3.score < 70) {
      actionKeysSet.add('OPEN_RECEIVABLES');
      if (inputs.overdueInvoicesCount > 0) {
        actionKeysSet.add('OPEN_OVERDUE_INVOICES');
      }
    }
    if (dim4.score !== null && dim4.score < 70) {
      actionKeysSet.add('OPEN_PAYABLES');
    }
    if (dim5.status === 'SUFFICIENT' && dim5.score !== null && dim5.score < 70) {
      if (inputs.lowStockCount > 0 || inputs.outOfStockCount > 0) {
        actionKeysSet.add('OPEN_LOW_STOCK');
      }
      actionKeysSet.add('OPEN_INVENTORY');
    }

    // Default actions if none triggered
    if (actionKeysSet.size === 0) {
      actionKeysSet.add('OPEN_SALES_REPORT');
      actionKeysSet.add('OPEN_PROFITABILITY_REPORT');
    }

    return {
      formulaVersion: this.FORMULA_VERSION,
      status: 'READY',
      score: finalScore,
      scoreBand,
      dataCoverage: inputs.dataCoverage,
      evaluationPeriod: inputs.evaluationPeriod,
      asOfTimestamp: inputs.asOfTimestamp,
      businessTimezone: inputs.businessTimezone,
      currencyCode: inputs.currencyCode,
      sourceFingerprint: inputs.sourceFingerprint,
      applicableDimensionKeys: applicableDimensions.map((d) => d.key),
      dimensions: allDimensions,
      strengthReasonKeys: allStrengthReasons.slice(0, 5),
      attentionReasonKeys: allAttentionReasons.slice(0, 5),
      actionKeys: Array.from(actionKeysSet).slice(0, 4),
    };
  }

  /**
   * Dimension 1: Sales & Profitability (Weight: 30)
   */
  private static calculateSalesProfitability(inputs: HealthScoreRawInputs): BusinessHealthDimensionResult {
    const config = V1_DIMENSION_CONFIGS.SALES_PROFITABILITY;
    const netSales = inputs.netSalesMinor;
    const cogs = inputs.cogsMinor;
    const grossProfit = inputs.grossProfitMinor;
    const operatingResult = inputs.operatingResultMinor;

    let score = 50;
    const reasonKeys: BusinessHealthReasonKey[] = [];

    if (netSales <= 0) {
      score = grossProfit < 0 || operatingResult < 0 ? 15 : 40;
      reasonKeys.push('SALES_VOLUME_LOW');
      if (operatingResult < 0) {
        reasonKeys.push('OPERATING_RESULT_NEGATIVE');
      }
    } else {
      const gpm = grossProfit / netSales;
      if (gpm >= 0.40) {
        score = 90;
        reasonKeys.push('GROSS_PROFIT_STRONG');
      } else if (gpm >= 0.20) {
        score = 75;
        reasonKeys.push('GROSS_PROFIT_HEALTHY');
      } else if (gpm > 0) {
        score = 60;
        reasonKeys.push('GROSS_PROFIT_LOW');
      } else {
        score = 20;
        reasonKeys.push('GROSS_PROFIT_NEGATIVE');
      }

      if (operatingResult > 0) {
        score = Math.min(100, score + 10);
        reasonKeys.push('OPERATING_RESULT_POSITIVE');
      } else if (operatingResult < 0) {
        score = Math.max(0, score - 20);
        reasonKeys.push('OPERATING_RESULT_NEGATIVE');
      }

      if (inputs.salesCount >= 5) {
        reasonKeys.push('SALES_VOLUME_ADEQUATE');
      }
    }

    return {
      key: config.key,
      name: config.name,
      status: 'SUFFICIENT',
      score,
      configuredWeight: config.baseWeight,
      appliedWeight: config.baseWeight,
      reasonKeys,
      sourceFactKeys: ['net_sales', 'gross_profit', 'operating_result', 'sales_count'],
    };
  }

  /**
   * Dimension 2: Operating Efficiency (Weight: 25)
   */
  private static calculateOperatingEfficiency(inputs: HealthScoreRawInputs): BusinessHealthDimensionResult {
    const config = V1_DIMENSION_CONFIGS.OPERATING_EFFICIENCY;
    const opex = inputs.operatingExpensesMinor;
    const gp = inputs.grossProfitMinor;
    const netSales = inputs.netSalesMinor;

    let score = 65;
    const reasonKeys: BusinessHealthReasonKey[] = [];

    // Derive expense burden ratio
    let ebr = 1.0;
    if (gp > 0) {
      ebr = opex / gp;
    } else if (netSales > 0) {
      ebr = opex / netSales;
    } else if (opex === 0) {
      ebr = 0;
    }

    if (ebr <= 0.40) {
      score = 95;
      reasonKeys.push('EXPENSE_MANAGEMENT_EFFICIENT');
    } else if (ebr <= 0.65) {
      score = 80;
      reasonKeys.push('EXPENSE_MANAGEMENT_EFFICIENT');
    } else if (ebr <= 0.85) {
      score = 65;
      reasonKeys.push('EXPENSE_PRESSURE_MODERATE');
    } else if (ebr <= 1.00) {
      score = 50;
      reasonKeys.push('EXPENSE_PRESSURE_ELEVATED');
    } else {
      score = Math.max(10, Math.round(50 - (ebr - 1.0) * 40));
      reasonKeys.push('EXPENSES_EXCEED_GROSS_PROFIT');
    }

    return {
      key: config.key,
      name: config.name,
      status: 'SUFFICIENT',
      score,
      configuredWeight: config.baseWeight,
      appliedWeight: config.baseWeight,
      reasonKeys,
      sourceFactKeys: ['operating_expenses', 'gross_profit', 'net_sales'],
    };
  }

  /**
   * Dimension 3: Receivables & Collection (Weight: 20)
   */
  private static calculateReceivables(inputs: HealthScoreRawInputs): BusinessHealthDimensionResult {
    const config = V1_DIMENSION_CONFIGS.RECEIVABLES_COLLECTION;
    const ar = inputs.totalReceivablesMinor;
    const netSales = inputs.netSalesMinor;
    const overdueCount = inputs.overdueInvoicesCount;

    let score = 80;
    const reasonKeys: BusinessHealthReasonKey[] = [];

    if (ar === 0) {
      score = 100;
      reasonKeys.push('RECEIVABLES_MINIMAL');
    } else {
      const denom = Math.max(netSales, 1);
      const rer = ar / denom;

      if (rer <= 0.15) {
        score = 90;
        reasonKeys.push('RECEIVABLES_HEALTHY');
      } else if (rer <= 0.35) {
        score = 75;
        reasonKeys.push('RECEIVABLES_HEALTHY');
      } else if (rer <= 0.60) {
        score = 60;
        reasonKeys.push('RECEIVABLES_ELEVATED');
      } else {
        score = 40;
        reasonKeys.push('RECEIVABLES_ELEVATED');
      }

      if (overdueCount > 0) {
        const penalty = overdueCount >= 3 ? 20 : 10;
        score = Math.max(10, score - penalty);
        reasonKeys.push('OVERDUE_INVOICES_PRESENT');
      } else {
        reasonKeys.push('NO_OVERDUE_INVOICES');
      }
    }

    return {
      key: config.key,
      name: config.name,
      status: 'SUFFICIENT',
      score,
      configuredWeight: config.baseWeight,
      appliedWeight: config.baseWeight,
      reasonKeys,
      sourceFactKeys: ['accounts_receivable', 'overdue_invoices_count'],
    };
  }

  /**
   * Dimension 4: Business Obligations (Weight: 15)
   */
  private static calculatePayables(inputs: HealthScoreRawInputs): BusinessHealthDimensionResult {
    const config = V1_DIMENSION_CONFIGS.BUSINESS_OBLIGATIONS;
    const ap = inputs.totalPayablesMinor;
    const gp = inputs.grossProfitMinor;

    let score = 80;
    const reasonKeys: BusinessHealthReasonKey[] = [];

    if (ap === 0) {
      score = 100;
      reasonKeys.push('PAYABLES_CLEAN');
    } else if (gp <= 0) {
      score = 30;
      reasonKeys.push('PAYABLES_ELEVATED');
    } else {
      const pbr = ap / gp;
      if (pbr <= 0.25) {
        score = 90;
        reasonKeys.push('PAYABLES_MANAGEABLE');
      } else if (pbr <= 0.50) {
        score = 75;
        reasonKeys.push('PAYABLES_MANAGEABLE');
      } else if (pbr <= 0.80) {
        score = 60;
        reasonKeys.push('PAYABLES_ELEVATED');
      } else {
        score = 40;
        reasonKeys.push('PAYABLES_ELEVATED');
      }
    }

    return {
      key: config.key,
      name: config.name,
      status: 'SUFFICIENT',
      score,
      configuredWeight: config.baseWeight,
      appliedWeight: config.baseWeight,
      reasonKeys,
      sourceFactKeys: ['accounts_payable', 'gross_profit'],
    };
  }

  /**
   * Dimension 5: Inventory Readiness (Weight: 10)
   * If trackedProductsCount === 0, status is NOT_APPLICABLE with 0 applied weight.
   */
  private static calculateInventory(inputs: HealthScoreRawInputs): BusinessHealthDimensionResult {
    const config = V1_DIMENSION_CONFIGS.INVENTORY_READINESS;
    const trackedCount = inputs.trackedProductsCount;
    const lowStock = inputs.lowStockCount;
    const outOfStock = inputs.outOfStockCount;

    if (trackedCount === 0) {
      return {
        key: config.key,
        name: config.name,
        status: 'NOT_APPLICABLE',
        score: null,
        configuredWeight: config.baseWeight,
        appliedWeight: 0,
        reasonKeys: ['INVENTORY_NOT_APPLICABLE'],
        sourceFactKeys: ['inventory_tracked_count'],
      };
    }

    const srr = (lowStock + 2 * outOfStock) / trackedCount;
    let score = 70;
    const reasonKeys: BusinessHealthReasonKey[] = [];

    if (srr === 0) {
      score = 100;
      reasonKeys.push('INVENTORY_OPTIMAL');
    } else if (srr <= 0.15) {
      score = 85;
      reasonKeys.push('INVENTORY_STABLE');
    } else if (srr <= 0.35) {
      score = 70;
      if (lowStock > 0) reasonKeys.push('LOW_STOCK_ALERT');
      if (outOfStock > 0) reasonKeys.push('OUT_OF_STOCK_ALERT');
    } else if (srr <= 0.60) {
      score = 50;
      if (lowStock > 0) reasonKeys.push('LOW_STOCK_ALERT');
      if (outOfStock > 0) reasonKeys.push('OUT_OF_STOCK_ALERT');
    } else {
      score = 25;
      if (lowStock > 0) reasonKeys.push('LOW_STOCK_ALERT');
      if (outOfStock > 0) reasonKeys.push('OUT_OF_STOCK_ALERT');
    }

    return {
      key: config.key,
      name: config.name,
      status: 'SUFFICIENT',
      score,
      configuredWeight: config.baseWeight,
      appliedWeight: config.baseWeight,
      reasonKeys,
      sourceFactKeys: ['low_stock_count', 'out_of_stock_count', 'inventory_tracked_count'],
    };
  }

  /**
   * Derives human-facing score band from numeric score.
   */
  public static deriveScoreBand(score: number): BusinessHealthScoreBand {
    if (score >= 80) return 'STRONG';
    if (score >= 65) return 'GOOD';
    if (score >= 50) return 'FAIR';
    return 'NEEDS_ATTENTION';
  }

  private static isStrengthReason(reason: BusinessHealthReasonKey): boolean {
    return [
      'GROSS_PROFIT_STRONG',
      'GROSS_PROFIT_HEALTHY',
      'OPERATING_RESULT_POSITIVE',
      'SALES_VOLUME_ADEQUATE',
      'EXPENSE_MANAGEMENT_EFFICIENT',
      'RECEIVABLES_MINIMAL',
      'RECEIVABLES_HEALTHY',
      'NO_OVERDUE_INVOICES',
      'PAYABLES_CLEAN',
      'PAYABLES_MANAGEABLE',
      'INVENTORY_OPTIMAL',
      'INVENTORY_STABLE',
      'DATA_COVERAGE_COMPREHENSIVE',
      'DATA_COVERAGE_ESTABLISHED',
    ].includes(reason);
  }

  private static isAttentionReason(reason: BusinessHealthReasonKey): boolean {
    return [
      'GROSS_PROFIT_LOW',
      'GROSS_PROFIT_NEGATIVE',
      'OPERATING_RESULT_NEGATIVE',
      'SALES_VOLUME_LOW',
      'EXPENSE_PRESSURE_MODERATE',
      'EXPENSE_PRESSURE_ELEVATED',
      'EXPENSES_EXCEED_GROSS_PROFIT',
      'RECEIVABLES_ELEVATED',
      'OVERDUE_INVOICES_PRESENT',
      'PAYABLES_ELEVATED',
      'LOW_STOCK_ALERT',
      'OUT_OF_STOCK_ALERT',
      'DATA_COVERAGE_EARLY',
      'DATA_COVERAGE_INSUFFICIENT',
    ].includes(reason);
  }
}
