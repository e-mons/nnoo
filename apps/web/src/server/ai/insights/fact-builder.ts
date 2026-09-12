import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BusinessSummaryType,
  BusinessSummaryPeriodComparison,
  VerifiedPerformanceFacts,
  VerifiedCurrentPositionFacts,
  VerifiedFactBundle,
} from '@nnoo/contracts';
import { AISafeError } from '../service';

export interface FactBuilderOptions {
  supabase: SupabaseClient;
  businessId: string;
  userRole: string;
  summaryType: BusinessSummaryType;
  currencyCode?: string;
  timezone?: string;
  periodComparison: BusinessSummaryPeriodComparison;
}

/**
 * Builds deterministic, permission-scoped Verified Fact Bundles from canonical reporting RPCs.
 * Strictly adheres to "NNOO COMPUTES, ZERO GEMINI FINANCIAL INVENTIONS".
 */
export class VerifiedFactBuilderService {
  /**
   * Fetches canonical reporting metrics and constructs an immutable fact bundle.
   */
  public static async buildFactBundle(options: FactBuilderOptions): Promise<VerifiedFactBundle> {
    const {
      supabase,
      businessId,
      userRole,
      summaryType,
      currencyCode = 'NGN',
      timezone = 'Africa/Lagos',
      periodComparison,
    } = options;

    // 1. Determine permitted fact keys based on role
    const isFullFinancialRole = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isFullFinancialRole) {
      throw new AISafeError(
        'AI_INSIGHTS_FORBIDDEN',
        `Role '${userRole}' is not authorized to generate or view full financial business summaries.`,
        false
      );
    }

    const permittedFactKeys = [
      'net_sales',
      'gross_sales',
      'refunds',
      'sales_count',
      'cogs',
      'gross_profit',
      'operating_expenses',
      'operating_result',
      'accounts_receivable',
      'accounts_payable',
      'inventory_value',
      'low_stock_count',
      'out_of_stock_count',
      'overdue_invoices_count',
    ];

    // 2. Fetch canonical current performance, previous performance, and current position
    const currentPeriod = periodComparison.current;
    const prevPeriod = periodComparison.previous;

    const [currentPerfRes, prevPerfRes, currentPosRes] = await Promise.all([
      supabase.rpc('get_dashboard_performance_metrics', {
        p_business_id: businessId,
        p_start_date: currentPeriod.start,
        p_end_date: currentPeriod.end,
      }),
      prevPeriod && periodComparison.isComparable
        ? supabase.rpc('get_dashboard_performance_metrics', {
            p_business_id: businessId,
            p_start_date: prevPeriod.start,
            p_end_date: prevPeriod.end,
          })
        : Promise.resolve({ data: null, error: null }),
      supabase.rpc('get_dashboard_current_position', {
        p_business_id: businessId,
      }),
    ]);

    if (currentPerfRes.error) {
      throw new AISafeError(
        'AI_INSIGHTS_FACT_BUILD_FAILED',
        `Failed to retrieve current performance metrics: ${currentPerfRes.error.message}`,
        true
      );
    }
    if (currentPosRes.error) {
      throw new AISafeError(
        'AI_INSIGHTS_FACT_BUILD_FAILED',
        `Failed to retrieve current position metrics: ${currentPosRes.error.message}`,
        true
      );
    }

    // 3. Normalize RPC JSON results to typed numeric structures (minor currency units)
    const rawPerf = currentPerfRes.data || {};
    const performance: VerifiedPerformanceFacts = {
      grossSalesMinor: parseInt(rawPerf.grossSalesMinor || '0', 10),
      salesCount: rawPerf.salesCount || 0,
      refundsMinor: parseInt(rawPerf.refundsMinor || '0', 10),
      netSalesMinor: parseInt(rawPerf.netSalesMinor || '0', 10),
      customerPaymentsReceivedMinor: parseInt(rawPerf.customerPaymentsReceivedMinor || '0', 10),
      cogsMinor: parseInt(rawPerf.cogsMinor || '0', 10),
      grossProfitMinor: parseInt(rawPerf.grossProfitMinor || '0', 10),
      operatingExpensesMinor: parseInt(rawPerf.operatingExpensesMinor || '0', 10),
      inventoryAdjustmentGainMinor: parseInt(rawPerf.inventoryAdjustmentGainMinor || '0', 10),
      inventoryShrinkageLossMinor: parseInt(rawPerf.inventoryShrinkageLossMinor || '0', 10),
      operatingResultMinor: parseInt(rawPerf.operatingResultMinor || '0', 10),
    };

    let previousPerformance: VerifiedPerformanceFacts | null = null;
    if (prevPerfRes && prevPerfRes.data) {
      const rawPrev = prevPerfRes.data;
      previousPerformance = {
        grossSalesMinor: parseInt(rawPrev.grossSalesMinor || '0', 10),
        salesCount: rawPrev.salesCount || 0,
        refundsMinor: parseInt(rawPrev.refundsMinor || '0', 10),
        netSalesMinor: parseInt(rawPrev.netSalesMinor || '0', 10),
        customerPaymentsReceivedMinor: parseInt(rawPrev.customerPaymentsReceivedMinor || '0', 10),
        cogsMinor: parseInt(rawPrev.cogsMinor || '0', 10),
        grossProfitMinor: parseInt(rawPrev.grossProfitMinor || '0', 10),
        operatingExpensesMinor: parseInt(rawPrev.operatingExpensesMinor || '0', 10),
        inventoryAdjustmentGainMinor: parseInt(rawPrev.inventoryAdjustmentGainMinor || '0', 10),
        inventoryShrinkageLossMinor: parseInt(rawPrev.inventoryShrinkageLossMinor || '0', 10),
        operatingResultMinor: parseInt(rawPrev.operatingResultMinor || '0', 10),
      };
    }

    const rawPos = currentPosRes.data || {};
    const currentPosition: VerifiedCurrentPositionFacts = {
      accountsReceivableMinor: parseInt(rawPos.accountsReceivableMinor || '0', 10),
      accountsPayableMinor: parseInt(rawPos.accountsPayableMinor || '0', 10),
      inventoryValueMinor: parseInt(rawPos.inventoryValueMinor || '0', 10),
      lowStockCount: rawPos.lowStockCount || 0,
      outOfStockCount: rawPos.outOfStockCount || 0,
      overdueInvoicesCount: rawPos.overdueInvoicesCount || 0,
      asOfTimestamp: new Date().toISOString(),
    };

    // 4. Data sufficiency check (has at least some activity or position)
    const hasActivity =
      performance.salesCount > 0 ||
      performance.grossSalesMinor > 0 ||
      performance.operatingExpensesMinor > 0 ||
      currentPosition.accountsReceivableMinor > 0 ||
      currentPosition.accountsPayableMinor > 0 ||
      currentPosition.inventoryValueMinor > 0 ||
      currentPosition.lowStockCount > 0 ||
      currentPosition.overdueInvoicesCount > 0;

    return {
      schemaVersion: '1.0.0',
      businessId,
      currencyCode,
      timezone,
      summaryType,
      period: currentPeriod,
      comparison: periodComparison,
      performance,
      previousPerformance,
      currentPosition,
      permittedFactKeys,
      generatedAt: new Date().toISOString(),
      hasSufficientData: hasActivity,
    };
  }
}
