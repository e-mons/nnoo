import 'server-only';
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessHealthDataCoverage } from '@nnoo/contracts';
import { AISafeError } from '../service';
import { BusinessPeriodResolver } from '../insights/period-resolver';
import type { HealthScoreRawInputs } from './formula/v1';

export interface HealthScoreInputBuilderOptions {
  supabase: SupabaseClient;
  businessId: string;
  userRole: string;
  currencyCode?: string;
  timezone?: string;
}

export class HealthScoreInputBuilder {
  /**
   * Fetches canonical operational data and builds the HealthScoreRawInputs.
   */
  public static async buildInputs(options: HealthScoreInputBuilderOptions): Promise<HealthScoreRawInputs> {
    const {
      supabase,
      businessId,
      userRole,
      currencyCode = 'NGN',
      timezone = 'Africa/Lagos',
    } = options;

    // 1. Role verification: Health score requires full financial visibility
    const isAuthorizedRole = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isAuthorizedRole) {
      throw new AISafeError(
        'BUSINESS_HEALTH_FORBIDDEN',
        `Role '${userRole}' is not authorized to calculate or view the Business Health Score.`,
        false
      );
    }

    // 2. Resolve evaluation period (default: this_month in business timezone)
    const periodComparison = BusinessPeriodResolver.resolvePeriod('this_month', timezone);
    const evaluationPeriod = {
      start: periodComparison.current.start,
      end: periodComparison.current.end,
    };
    const asOfTimestamp = new Date().toISOString();

    // 3. Fetch canonical performance, position, and business registration date concurrently
    // 3. Fetch canonical performance, position, and business registration date concurrently
    const [perfRes, posRes, bizRes, oldestSaleRes, oldestExpenseRes] = await Promise.all([
      supabase.rpc('get_dashboard_performance_metrics', {
        p_business_id: businessId,
        p_start_date: evaluationPeriod.start,
        p_end_date: evaluationPeriod.end,
      }),
      supabase.rpc('get_dashboard_current_position', {
        p_business_id: businessId,
      }),
      supabase
        .from('businesses')
        .select('id, created_at, status')
        .eq('id', businessId)
        .maybeSingle(),
      supabase
        .from('sales')
        .select('effective_date')
        .eq('business_id', businessId)
        .order('effective_date', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('expenses')
        .select('effective_date')
        .eq('business_id', businessId)
        .order('effective_date', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (perfRes.error) {
      throw new AISafeError(
        'BUSINESS_HEALTH_CALCULATION_FAILED',
        `Failed to retrieve performance metrics: ${perfRes.error.message}`,
        true
      );
    }

    if (posRes.error) {
      throw new AISafeError(
        'BUSINESS_HEALTH_CALCULATION_FAILED',
        `Failed to retrieve position metrics: ${posRes.error.message}`,
        true
      );
    }

    if (bizRes.error || !bizRes.data) {
      throw new AISafeError(
        'BUSINESS_HEALTH_BUSINESS_RESTRICTED',
        'Business record not found or inaccessible.',
        false
      );
    }

    if (bizRes.data.status === 'suspended') {
      throw new AISafeError(
        'BUSINESS_HEALTH_BUSINESS_RESTRICTED',
        'Business is currently suspended.',
        false
      );
    }

    const perfData = (perfRes.data as Record<string, unknown>) || {};
    const posData = (posRes.data as Record<string, unknown>) || {};

    const netSalesMinor = Number(perfData.netSalesMinor ?? perfData.net_sales_minor ?? perfData.net_sales ?? 0) || 0;
    const grossSalesMinor = Number(perfData.grossSalesMinor ?? perfData.gross_sales_minor ?? perfData.gross_sales ?? 0) || 0;
    const cogsMinor = Number(perfData.cogsMinor ?? perfData.cogs_minor ?? perfData.cogs ?? 0) || 0;
    const grossProfitMinor = Number(perfData.grossProfitMinor ?? perfData.gross_profit_minor ?? perfData.gross_profit ?? 0) || 0;
    const operatingExpensesMinor = Number(perfData.operatingExpensesMinor ?? perfData.operating_expenses_minor ?? perfData.operating_expenses ?? 0) || 0;
    const operatingResultMinor = Number(perfData.operatingResultMinor ?? perfData.operating_result_minor ?? perfData.operating_result ?? 0) || 0;
    const salesCount = Number(perfData.salesCount ?? perfData.sales_count ?? 0) || (netSalesMinor > 0 ? 1 : 0);

    const totalReceivablesMinor = Number(posData.accountsReceivableMinor ?? posData.accounts_receivable_minor ?? posData.accounts_receivable ?? 0) || 0;
    const overdueInvoicesCount = Number(posData.overdueInvoicesCount ?? posData.overdue_invoices_count ?? 0) || 0;
    const totalPayablesMinor = Number(posData.accountsPayableMinor ?? posData.accounts_payable_minor ?? posData.accounts_payable ?? 0) || 0;

    const inventoryValueMinor = Number(posData.inventoryValueMinor ?? posData.inventory_value_minor ?? posData.inventory_value ?? 0) || 0;
    const trackedProductsCount = Number(posData.tracked_items_count ?? (inventoryValueMinor > 0 ? 1 : 0)) || 0;
    const lowStockCount = Number(posData.lowStockCount ?? posData.low_stock_count ?? 0) || 0;
    const outOfStockCount = Number(posData.outOfStockCount ?? posData.out_of_stock_count ?? 0) || 0;

    // 4. Calculate Data Coverage
    const bizCreatedAt = new Date(bizRes.data.created_at || Date.now());
    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - bizCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));

    let dataCoverage: BusinessHealthDataCoverage = 'LOW';
    const hasTransactions = netSalesMinor > 0 || operatingExpensesMinor > 0 || salesCount > 0;

    if (!hasTransactions && daysSinceCreation < 7) {
      dataCoverage = 'INSUFFICIENT';
    } else if (daysSinceCreation >= 60 && hasTransactions) {
      dataCoverage = 'HIGH';
    } else if (daysSinceCreation >= 21 && hasTransactions) {
      dataCoverage = 'MEDIUM';
    } else if (hasTransactions || daysSinceCreation >= 7) {
      dataCoverage = 'LOW';
    } else {
      dataCoverage = 'INSUFFICIENT';
    }

    // 5. Generate deterministic cryptographic SHA-256 fingerprint
    const fingerprintPayload = {
      formulaVersion: 'business-health-score-v1',
      evaluationPeriod,
      netSalesMinor,
      grossSalesMinor,
      cogsMinor,
      grossProfitMinor,
      operatingExpensesMinor,
      operatingResultMinor,
      salesCount,
      totalReceivablesMinor,
      overdueInvoicesCount,
      totalPayablesMinor,
      trackedProductsCount,
      lowStockCount,
      outOfStockCount,
      dataCoverage,
      currencyCode,
    };

    const sourceFingerprint = createHash('sha256')
      .update(JSON.stringify(fingerprintPayload))
      .digest('hex');

    return {
      netSalesMinor,
      grossSalesMinor,
      cogsMinor,
      grossProfitMinor,
      operatingExpensesMinor,
      operatingResultMinor,
      salesCount,
      totalReceivablesMinor,
      overdueInvoicesCount,
      totalPayablesMinor,
      trackedProductsCount,
      lowStockCount,
      outOfStockCount,
      dataCoverage,
      evaluationPeriod,
      asOfTimestamp,
      businessTimezone: timezone,
      currencyCode,
      sourceFingerprint,
    };
  }
}
