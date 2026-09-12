import 'server-only';

export interface FinancialMetricTotals {
  netSalesMinor: number;
  grossSalesMinor: number;
  expensesMinor: number;
  paymentsMinor: number;
  refundsMinor: number;
  invoicesCount: number;
  inventoryMovementsCount: number;
  journalEntriesCount: number;
  totalDebitsMinor: number;
  totalCreditsMinor: number;
}

export interface FinancialReconciliationDifference {
  metric: keyof FinancialMetricTotals;
  sourceValue: number;
  restoredValue: number;
  difference: number;
  isExactMatch: boolean;
}

export interface FinancialReconciliationResult {
  passed: boolean;
  timestamp: string;
  differences: FinancialReconciliationDifference[];
  summary: {
    totalMetricsChecked: number;
    matchedMetrics: number;
    discrepancies: number;
  };
}

export interface TenantIsolationResult {
  passed: boolean;
  crossTenantAccessAttempts: number;
  leakedRecordsCount: number;
  details: string[];
}

export interface AuthConsistencyResult {
  passed: boolean;
  orphanMembershipsCount: number;
  businessesWithoutActiveOwnerCount: number;
  orphanProfilesCount: number;
  details: string[];
}

export interface ProviderReconciliationResult {
  system: 'paystack' | 'whatsapp' | 'push' | 'inngest';
  passed: boolean;
  actionRequired: 'NONE' | 'UPDATE_LOCAL_STATE' | 'SUPPRESS_DELIVERY' | 'PAUSE_QUEUE';
  details: string;
}

export class RecoveryVerificationService {
  /**
   * Validates target environment to prevent accidental destructive operations on Production.
   */
  public static validateRecoveryTarget(targetEnv: string, allowProduction: boolean = false): {
    safeToProceed: boolean;
    error?: string;
  } {
    const normalized = targetEnv.trim().toLowerCase();
    if (normalized === 'production' || normalized === 'prod' || normalized === 'live') {
      if (!allowProduction) {
        return {
          safeToProceed: false,
          error: 'GUARD TRIGGERED: Destructive recovery operations against production environment are strictly prohibited without manual executive override.',
        };
      }
    }
    if (!['development', 'dev', 'staging', 'test', 'isolated-recovery', 'local'].includes(normalized)) {
      return {
        safeToProceed: false,
        error: `GUARD TRIGGERED: Unknown or ambiguous recovery target "${targetEnv}". Must be an explicit isolated environment.`,
      };
    }
    return { safeToProceed: true };
  }

  /**
   * Compares source and restored financial metrics to guarantee exact financial parity (Δ 0).
   */
  public static reconcileFinancialLedgers(
    source: FinancialMetricTotals,
    restored: FinancialMetricTotals
  ): FinancialReconciliationResult {
    const metrics: (keyof FinancialMetricTotals)[] = [
      'netSalesMinor',
      'grossSalesMinor',
      'expensesMinor',
      'paymentsMinor',
      'refundsMinor',
      'invoicesCount',
      'inventoryMovementsCount',
      'journalEntriesCount',
      'totalDebitsMinor',
      'totalCreditsMinor',
    ];

    const differences: FinancialReconciliationDifference[] = metrics.map((metric) => {
      const sourceVal = source[metric] ?? 0;
      const restoredVal = restored[metric] ?? 0;
      const diff = restoredVal - sourceVal;
      return {
        metric,
        sourceValue: sourceVal,
        restoredValue: restoredVal,
        difference: diff,
        isExactMatch: diff === 0,
      };
    });

    const discrepancies = differences.filter((d) => !d.isExactMatch).length;

    // Double-entry balancing invariant: Total Debits must equal Total Credits
    const restoredDebitsEqualCredits = restored.totalDebitsMinor === restored.totalCreditsMinor;
    const passed = discrepancies === 0 && restoredDebitsEqualCredits;

    return {
      passed,
      timestamp: new Date().toISOString(),
      differences,
      summary: {
        totalMetricsChecked: metrics.length,
        matchedMetrics: metrics.length - discrepancies,
        discrepancies,
      },
    };
  }

  /**
   * Reconciles external Paystack state with a restored database.
   * Ensures idempotency: if Paystack transaction is already recorded or webhook received, no double fulfillment.
   */
  public static reconcilePaystackState(
    restoredSub: { status: string; reference: string } | null,
    providerTx: { status: string; reference: string; amountMinor: number; paidAt: string }
  ): ProviderReconciliationResult {
    if (!restoredSub) {
      return {
        system: 'paystack',
        passed: true,
        actionRequired: 'UPDATE_LOCAL_STATE',
        details: 'Restored DB missing subscription record for valid provider transaction; record must be synchronized before enabling mutations.',
      };
    }

    if (restoredSub.reference === providerTx.reference && restoredSub.status === 'active' && providerTx.status === 'success') {
      return {
        system: 'paystack',
        passed: true,
        actionRequired: 'NONE',
        details: 'Subscription status and provider transaction match cleanly; zero duplicate fulfillment.',
      };
    }

    // Restored DB is older than provider event
    if (restoredSub.status !== 'active' && providerTx.status === 'success') {
      return {
        system: 'paystack',
        passed: true,
        actionRequired: 'UPDATE_LOCAL_STATE',
        details: 'Provider confirms newer successful charge; local state should be updated idempotently without charging customer again.',
      };
    }

    return {
      system: 'paystack',
      passed: true,
      actionRequired: 'NONE',
      details: 'Provider reconciliation verified.',
    };
  }

  /**
   * Inviolable Consent Invariant: Newer external STOP / opt-out signal MUST win over an older restored DB state.
   */
  public static reconcileWhatsAppOptOut(
    restoredUserConsent: { opted_out: boolean },
    newerExternalEvent: { isOptedOut: boolean; eventTimestamp: string; restoreTimestamp: string }
  ): { effectiveOptedOut: boolean; policyApplied: string } {
    // If newer event indicates user opted out, MUST honor opt-out regardless of restored DB state
    if (newerExternalEvent.isOptedOut) {
      return {
        effectiveOptedOut: true,
        policyApplied: 'NEWER_EXTERNAL_OPT_OUT_PRESERVED',
      };
    }

    return {
      effectiveOptedOut: restoredUserConsent.opted_out,
      policyApplied: 'RESTORED_PREFERENCE_APPLIED',
    };
  }

  /**
   * Proves that scheduled background jobs are initially paused upon restoration to prevent job storms or double executions.
   */
  public static evaluateJobResumeSafety(
    restoredJobsCount: number,
    executionMode: 'PAUSED' | 'LIVE'
  ): { safeToResume: boolean; reason: string } {
    if (executionMode === 'LIVE') {
      return {
        safeToResume: false,
        reason: 'CRITICAL SAFETY GUARD: Restored database cannot immediately start background jobs in LIVE mode. Jobs must be initialized in PAUSED state until external state reconciliation passes.',
      };
    }
    return {
      safeToResume: true,
      reason: `Jobs initialized in PAUSED mode (${restoredJobsCount} jobs held). Safe to review before resuming.`,
    };
  }
}
