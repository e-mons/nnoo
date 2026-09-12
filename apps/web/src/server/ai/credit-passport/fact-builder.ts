import 'server-only';
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreditPassportPayload,
  CreditPassportStatus,
  CreditPassportDataCoverage,
  CreditPassportProvenanceType,
  CreditPassportBusinessIdentity,
  CreditPassportRecordedHistory,
  CreditPassportFinancialPerformance,
  CreditPassportCurrentPosition,
  CreditPassportInvoiceActivity,
  CreditPassportInventoryPosition,
  CreditPassportHealthSummary,
  CreditPassportDataCoverageSection,
} from '@nnoo/contracts';
import { AISafeError } from '../service';
import { BusinessHealthService } from '../health';

export interface CreditPassportFactBuilderOptions {
  supabase: SupabaseClient;
  businessId: string;
  userId?: string;
  userRole: string;
  currencyCode?: string;
  timezone?: string;
}

export interface CreditPassportBuiltFacts {
  status: CreditPassportStatus;
  dataCoverage: CreditPassportDataCoverage;
  payload: CreditPassportPayload;
  sourceFingerprint: string;
  artifactHash: string;
  healthScoreSnapshotId: string | null;
}

export class CreditPassportFactBuilder {
  /**
   * Deterministically builds canonical Credit Passport facts from database records.
   * Zero model calls.
   */
  public static async build(options: CreditPassportFactBuilderOptions): Promise<CreditPassportBuiltFacts> {
    const {
      supabase,
      businessId,
      userRole,
      currencyCode: fallbackCurrency = 'NGN',
      timezone: fallbackTimezone = 'Africa/Lagos',
    } = options;

    // 1. Role verification: Credit Passport requires full financial visibility
    const isAuthorizedRole = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isAuthorizedRole) {
      throw new AISafeError(
        'CREDIT_PASSPORT_FORBIDDEN',
        `Role '${userRole}' is not authorized to access or generate the Credit Passport.`,
        false
      );
    }

    // 2. Fetch business profile
    const { data: biz, error: bizError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        legal_name,
        industry,
        country_code,
        currency_code,
        timezone,
        city,
        state,
        registration_number,
        tax_identifier,
        status,
        created_at
      `)
      .eq('id', businessId)
      .maybeSingle();

    if (bizError || !biz) {
      throw new AISafeError(
        'CREDIT_PASSPORT_BUSINESS_RESTRICTED',
        'Business profile not found or inaccessible.',
        false
      );
    }

    if (biz.status === 'suspended') {
      throw new AISafeError(
        'CREDIT_PASSPORT_BUSINESS_RESTRICTED',
        'Business account is suspended.',
        false
      );
    }

    const businessTimezone = biz.timezone || fallbackTimezone;
    const currencyCode = biz.currency_code || fallbackCurrency;

    // 3. Compute 90-day evaluation window in business timezone
    const now = new Date();
    const nowInTzStr = now.toLocaleDateString('en-CA', { timeZone: businessTimezone }); // YYYY-MM-DD
    const periodEndDate = nowInTzStr;
    const endDateObj = new Date(nowInTzStr);
    const startDateObj = new Date(endDateObj);
    startDateObj.setDate(startDateObj.getDate() - 90);
    const periodStartDate = startDateObj.toLocaleDateString('en-CA', { timeZone: businessTimezone });
    const asOfTimestamp = now.toISOString();

    // 4. Fetch canonical reporting, positions, products, invoices, and earliest transactions concurrently
    const [
      perfRes,
      posRes,
      catalogCountRes,
      invoicesRes,
      oldestSaleRes,
      oldestExpenseRes,
      healthScoreResult,
    ] = await Promise.all([
      supabase.rpc('get_dashboard_performance_metrics', {
        p_business_id: businessId,
        p_start_date: periodStartDate,
        p_end_date: periodEndDate,
      }),
      supabase.rpc('get_dashboard_current_position', {
        p_business_id: businessId,
      }),
      supabase
        .from('catalog_items')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('item_type', 'product'),
      supabase
        .from('invoices')
        .select('id, document_status, total_minor, due_date')
        .eq('business_id', businessId),
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
      BusinessHealthService.getCurrentScore({
        supabase,
        businessId,
        userId: options.userId || '00000000-0000-0000-0000-000000000000',
        userRole,
        currencyCode,
        timezone: businessTimezone,
      }).catch(() => null),
    ]);

    if (perfRes.error) {
      throw new AISafeError(
        'CREDIT_PASSPORT_GENERATION_FAILED',
        `Failed to retrieve performance metrics: ${perfRes.error.message}`,
        true
      );
    }

    if (posRes.error) {
      throw new AISafeError(
        'CREDIT_PASSPORT_GENERATION_FAILED',
        `Failed to retrieve position metrics: ${posRes.error.message}`,
        true
      );
    }

    const rawPerf = Array.isArray(perfRes.data)
      ? ((perfRes.data[0] as Record<string, unknown>) || {})
      : ((perfRes.data as Record<string, unknown>) || {});

    const rawPos = Array.isArray(posRes.data)
      ? ((posRes.data[0] as Record<string, unknown>) || {})
      : ((posRes.data as Record<string, unknown>) || {});

    const netSalesMinor = Number(rawPerf.netSalesMinor ?? rawPerf.net_sales_minor ?? rawPerf.net_sales ?? 0) || 0;
    const grossSalesMinor = Number(rawPerf.grossSalesMinor ?? rawPerf.gross_sales_minor ?? rawPerf.gross_sales ?? 0) || 0;
    const refundsMinor = Number(rawPerf.refundsMinor ?? rawPerf.refunds_minor ?? rawPerf.refunds ?? 0) || 0;
    const grossProfitMinor = Number(rawPerf.grossProfitMinor ?? rawPerf.gross_profit_minor ?? rawPerf.gross_profit ?? 0) || 0;
    const operatingExpensesMinor = Number(rawPerf.operatingExpensesMinor ?? rawPerf.operating_expenses_minor ?? rawPerf.operating_expenses ?? 0) || 0;
    const operatingResultMinor = Number(rawPerf.operatingResultMinor ?? rawPerf.operating_result_minor ?? rawPerf.operating_result ?? 0) || 0;
    const salesCount = Number(rawPerf.salesCount ?? rawPerf.sales_count ?? 0) || (netSalesMinor > 0 ? 1 : 0);

    const accountsReceivableMinor = Number(rawPos.accountsReceivableMinor ?? rawPos.accounts_receivable_minor ?? rawPos.accounts_receivable ?? 0) || 0;
    const accountsPayableMinor = Number(rawPos.accountsPayableMinor ?? rawPos.accounts_payable_minor ?? rawPos.accounts_payable ?? 0) || 0;
    const inventoryValueMinor = Number(rawPos.inventoryValueMinor ?? rawPos.inventory_value_minor ?? rawPos.inventory_value ?? 0) || 0;
    const overdueInvoicesPosCount = Number(rawPos.overdueInvoicesCount ?? rawPos.overdue_invoices_count ?? 0) || 0;
    const lowStockCount = Number(rawPos.lowStockCount ?? rawPos.low_stock_count ?? 0) || 0;
    const outOfStockCount = Number(rawPos.outOfStockCount ?? rawPos.out_of_stock_count ?? 0) || 0;

    // 5. Build Recorded History
    const candidateEarliestDates: string[] = [];
    if (biz.created_at) candidateEarliestDates.push(biz.created_at.slice(0, 10));
    if (oldestSaleRes.data) {
      const saleDate = (oldestSaleRes.data as any).effective_date || (oldestSaleRes.data as any).sale_date;
      if (saleDate) candidateEarliestDates.push(saleDate);
    }
    if (oldestExpenseRes.data) {
      const expDate = (oldestExpenseRes.data as any).effective_date || (oldestExpenseRes.data as any).occurred_at;
      if (expDate) candidateEarliestDates.push(expDate.slice(0, 10));
    }

    candidateEarliestDates.sort();
    const firstRecordedDate = candidateEarliestDates.length > 0 ? candidateEarliestDates[0] : null;
    const lastRecordedDate = periodEndDate;

    let recordedDaysCount = 0;
    if (firstRecordedDate) {
      const diffMs = new Date(periodEndDate).getTime() - new Date(firstRecordedDate).getTime();
      recordedDaysCount = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }

    // 6. Invoices aggregation
    const invoices = (invoicesRes.data as any[]) || [];
    let paidInvoicesCount = 0;
    let pendingInvoicesCount = 0;
    let overdueInvoicesCount = 0;
    let overdueInvoicesAmountMinor = 0;

    for (const inv of invoices) {
      const status = inv.document_status || inv.status;
      const amount = Number(inv.total_minor ?? inv.amount_minor ?? 0) || 0;
      if (status === 'paid') {
        paidInvoicesCount++;
      } else if (status === 'overdue' || (inv.due_date && inv.due_date < periodEndDate && status !== 'void' && status !== 'voided' && status !== 'cancelled')) {
        overdueInvoicesCount++;
        overdueInvoicesAmountMinor += amount;
      } else if (['issued', 'sent', 'partially_paid'].includes(status)) {
        pendingInvoicesCount++;
      }
    }

    // 7. Inventory applicability
    const physicalProductsCount = catalogCountRes.count || 0;
    const isInventoryApplicable = physicalProductsCount > 0;

    // 8. Determine Data Coverage
    const hasSales = salesCount > 0 || netSalesMinor > 0;
    const hasExpenses = operatingExpensesMinor > 0;
    const hasInvoices = invoices.length > 0;

    let dataCoverageLevel: CreditPassportDataCoverage = 'insufficient';
    if (recordedDaysCount >= 60 && hasSales && hasExpenses) {
      dataCoverageLevel = 'high';
    } else if (recordedDaysCount >= 21 && (hasSales || hasExpenses)) {
      dataCoverageLevel = 'medium';
    } else if (recordedDaysCount >= 7 && (hasSales || hasExpenses)) {
      dataCoverageLevel = 'low';
    } else {
      dataCoverageLevel = 'insufficient';
    }

    // 9. Determine Passport Status
    let status: CreditPassportStatus = 'ready';
    if (dataCoverageLevel === 'insufficient') {
      status = 'insufficient_data';
    } else if (dataCoverageLevel === 'low') {
      status = 'limited_history';
    } else {
      status = 'ready';
    }

    // 10. Assemble Structured Sections with Clear Provenance
    const businessIdentity: CreditPassportBusinessIdentity = {
      name: biz.name,
      legalName: biz.legal_name,
      industry: biz.industry,
      countryCode: biz.country_code,
      currencyCode: currencyCode,
      timezone: businessTimezone,
      city: biz.city,
      state: biz.state,
      registrationNumber: biz.registration_number,
      taxIdentifier: biz.tax_identifier,
      businessCreatedAt: biz.created_at,
      provenance: 'BUSINESS_PROFILE_PROVIDED',
    };

    const recordedHistory: CreditPassportRecordedHistory = {
      firstRecordedDate,
      lastRecordedDate,
      recordedDaysCount,
      provenance: 'NNOO_OPERATIONAL_RECORD',
    };

    const financialPerformance: CreditPassportFinancialPerformance = {
      periodStart: periodStartDate,
      periodEnd: periodEndDate,
      netSalesMinor: netSalesMinor,
      grossSalesMinor: grossSalesMinor,
      salesCount: salesCount,
      refundsCount: refundsMinor > 0 ? 1 : 0,
      refundsTotalMinor: refundsMinor,
      grossProfitMinor: grossProfitMinor,
      operatingExpensesMinor: operatingExpensesMinor,
      operatingResultMinor: operatingResultMinor,
      provenance: 'NNOO_FINANCIAL_CALCULATION',
    };

    const currentPosition: CreditPassportCurrentPosition = {
      asOf: asOfTimestamp,
      accountsReceivableMinor: accountsReceivableMinor,
      accountsPayableMinor: accountsPayableMinor,
      inventoryValueMinor: isInventoryApplicable ? inventoryValueMinor : null,
      overdueInvoicesCount: overdueInvoicesCount,
      overdueInvoicesAmountMinor: overdueInvoicesAmountMinor,
      provenance: 'NNOO_OPERATIONAL_RECORD',
    };

    const invoiceActivity: CreditPassportInvoiceActivity = {
      totalInvoicesCount: invoices.length,
      paidInvoicesCount,
      pendingInvoicesCount,
      overdueInvoicesCount,
      provenance: 'NNOO_OPERATIONAL_RECORD',
    };

    const inventoryPosition: CreditPassportInventoryPosition = {
      isApplicable: isInventoryApplicable,
      inventoryValueMinor: isInventoryApplicable ? inventoryValueMinor : null,
      trackedItemsCount: physicalProductsCount,
      lowStockCount: isInventoryApplicable ? lowStockCount : 0,
      outOfStockCount: isInventoryApplicable ? outOfStockCount : 0,
      provenance: 'NNOO_OPERATIONAL_RECORD',
    };

    const healthScoreSummary: CreditPassportHealthSummary = {
      score: healthScoreResult?.score ?? null,
      scoreBand: healthScoreResult?.scoreBand ?? null,
      formulaVersion: healthScoreResult?.formulaVersion ?? 'business-health-score-v1',
      dataCoverage: healthScoreResult?.dataCoverage ?? 'INSUFFICIENT',
      asOf: healthScoreResult?.asOfTimestamp ?? asOfTimestamp,
      disclaimer:
        'The NNOO Business Health Score is an internal operational indicator calculated by NNOO from recorded activity. It is not a bank or credit bureau score and does not determine loan eligibility.',
      provenance: 'NNOO_HEALTH_SCORE',
    };

    let summaryText = `NNOO has recorded ${recordedDaysCount} days of business operations.`;
    if (dataCoverageLevel === 'insufficient') {
      summaryText = 'Limited operational records currently available in NNOO.';
    } else if (dataCoverageLevel === 'low') {
      summaryText = `NNOO has recorded ${recordedDaysCount} days of early operational activity.`;
    }

    const dataCoverageSection: CreditPassportDataCoverageSection = {
      level: dataCoverageLevel,
      recordedDays: recordedDaysCount,
      hasSales,
      hasExpenses,
      hasInvoices,
      hasInventory: isInventoryApplicable,
      summaryText,
    };

    const disclaimers = [
      'This Credit Passport reflects Business information recorded in NNOO as of the stated generation timestamp. It is not an independent audit of the Business.',
      'The Credit Passport is an operational Business profile and does not constitute a Credit Score, credit bureau rating, loan approval, or lending guarantee.',
      'Business Profile information was provided by the Business. Operational and financial figures are derived from records maintained in NNOO.',
    ];

    // 11. Source Fingerprint (Cryptographic SHA-256 of raw canonical facts)
    const rawFingerprintBundle = {
      businessId,
      bizName: biz.name,
      periodStart: periodStartDate,
      periodEnd: periodEndDate,
      perf: financialPerformance,
      pos: {
        accountsReceivableMinor: currentPosition.accountsReceivableMinor,
        accountsPayableMinor: currentPosition.accountsPayableMinor,
        inventoryValueMinor: currentPosition.inventoryValueMinor,
        overdueInvoicesCount: currentPosition.overdueInvoicesCount,
      },
      inv: invoiceActivity,
      stock: inventoryPosition,
      healthScore: healthScoreSummary.score,
      coverage: dataCoverageLevel,
    };
    const sourceFingerprint = createHash('sha256')
      .update(JSON.stringify(rawFingerprintBundle))
      .digest('hex');

    // 12. Assemble Payload
    const payload: CreditPassportPayload = {
      passportSchemaVersion: '1.0.0',
      businessIdentity,
      passportPeriod: {
        start: periodStartDate,
        end: periodEndDate,
      },
      recordedHistory,
      financialPerformance,
      currentPosition,
      invoiceActivity,
      inventoryPosition,
      healthScore: healthScoreSummary,
      dataCoverage: dataCoverageSection,
      disclaimers,
      asOfTimestamp,
      sourceFingerprint,
    };

    // 13. Canonical Artifact Hash (Cryptographic SHA-256 of normalized deterministic facts)
    const canonicalHashBundle = {
      schemaVersion: '1.0.0',
      businessIdentity,
      passportPeriod: { start: periodStartDate, end: periodEndDate },
      recordedHistory,
      financialPerformance,
      currentPosition: {
        accountsReceivableMinor: currentPosition.accountsReceivableMinor,
        accountsPayableMinor: currentPosition.accountsPayableMinor,
        inventoryValueMinor: currentPosition.inventoryValueMinor,
        overdueInvoicesCount: currentPosition.overdueInvoicesCount,
      },
      invoiceActivity,
      inventoryPosition,
      healthScore: {
        score: healthScoreSummary.score,
        scoreBand: healthScoreSummary.scoreBand,
        formulaVersion: healthScoreSummary.formulaVersion,
      },
      dataCoverage: dataCoverageSection,
      sourceFingerprint,
    };
    const artifactHash = createHash('sha256')
      .update(JSON.stringify(canonicalHashBundle))
      .digest('hex');

    let healthScoreSnapshotId: string | null = null;
    if (healthScoreResult && 'id' in healthScoreResult) {
      healthScoreSnapshotId = (healthScoreResult as any).id || null;
    }

    return {
      status,
      dataCoverage: dataCoverageLevel,
      payload,
      sourceFingerprint,
      artifactHash,
      healthScoreSnapshotId,
    };
  }
}
