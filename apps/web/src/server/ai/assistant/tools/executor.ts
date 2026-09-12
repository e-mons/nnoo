import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AskNnooToolKey,
  AskNnooFactReference,
  AskNnooEntityReference,
  AskNnooSourceKey,
  AskNnooActionKey,
} from '@nnoo/contracts';
import { AISafeError } from '../../service';
import { BusinessPeriodResolver } from '../../insights/period-resolver';
import { ASK_NNOO_TOOLS } from './registry';

export interface AskNnooToolExecutionContext {
  supabase: SupabaseClient;
  businessId: string;
  userId: string;
  userRole: string;
  currencyCode?: string;
  timezone?: string;
}

export interface ToolExecutionOutput {
  toolName: AskNnooToolKey;
  sourceKey: AskNnooSourceKey;
  defaultActionKey: AskNnooActionKey;
  requiredCapability: string;
  facts: AskNnooFactReference[];
  entities: AskNnooEntityReference[];
  dataSummary: string;
}

function formatCurrency(minor: number | string | null | undefined, currency: string = 'NGN'): string {
  const num = typeof minor === 'string' ? parseFloat(minor) : Number(minor);
  const safeMinor = isNaN(num) || !isFinite(num) ? 0 : num;
  const major = safeMinor / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(major);
}

function formatNumber(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  const safeValue = isNaN(num) || !isFinite(num) ? 0 : num;
  return new Intl.NumberFormat('en-NG').format(safeValue);
}

/**
 * Executes allowlisted Ask NNOO read-only tools against canonical services and database queries.
 * Enforces per-tool RBAC, data minimization, request bounding, and opaque candidate keys.
 */
export class AskNnooToolExecutor {
  public static async executeTool(
    toolName: AskNnooToolKey,
    params: Record<string, unknown>,
    ctx: AskNnooToolExecutionContext
  ): Promise<ToolExecutionOutput> {
    const toolDef = ASK_NNOO_TOOLS[toolName];
    if (!toolDef) {
      throw new AISafeError('ASK_NNOO_TOOL_NOT_ALLOWED', `Tool '${toolName}' is not recognized or permitted.`, false);
    }

    const { supabase, businessId, userRole, currencyCode = 'NGN', timezone = 'Africa/Lagos' } = ctx;

    // 1. Independent RBAC Authorization Preflight
    const isOwnerOrAdmin = ['owner', 'business_admin', 'manager'].includes(userRole);
    const isAccountant = userRole === 'accountant';
    const isSalesStaff = userRole === 'sales_staff';
    const isInventoryStaff = userRole === 'inventory_staff';
    const isReadOnly = userRole === 'read_only';

    let isAuthorized = false;
    switch (toolDef.requiredModule) {
      case 'reports':
      case 'insights':
        isAuthorized = isOwnerOrAdmin || isAccountant;
        break;
      case 'sales':
        isAuthorized = isOwnerOrAdmin || isAccountant || isSalesStaff || isReadOnly;
        break;
      case 'expenses':
        isAuthorized = isOwnerOrAdmin || isAccountant || isReadOnly;
        break;
      case 'inventory':
        isAuthorized = isOwnerOrAdmin || isInventoryStaff || isReadOnly;
        break;
      case 'products':
        isAuthorized = isOwnerOrAdmin || isInventoryStaff || isSalesStaff || isReadOnly;
        break;
      case 'invoices':
        isAuthorized = isOwnerOrAdmin || isAccountant || isSalesStaff || isReadOnly;
        break;
      case 'bookkeeper':
        isAuthorized = isOwnerOrAdmin || isAccountant;
        break;
      case 'customers':
        isAuthorized = isOwnerOrAdmin || isSalesStaff || isAccountant || isReadOnly;
        break;
      default:
        isAuthorized = false;
    }

    if (!isAuthorized) {
      throw new AISafeError(
        'ASK_NNOO_FORBIDDEN',
        `Role '${userRole}' is not permitted to access tool '${toolName}'.`,
        false
      );
    }

    // 2. Validate input parameters
    const parsedParams = toolDef.paramSchema.safeParse(params);
    if (!parsedParams.success) {
      throw new AISafeError('ASK_NNOO_TOOL_INPUT_INVALID', `Invalid arguments for tool '${toolName}'.`, false);
    }

    // 3. Dispatch to deterministic tool implementation
    switch (toolName) {
      case 'getBusinessOverview':
        return this.executeBusinessOverview(ctx, currencyCode, timezone);
      case 'getSalesSummary':
        return this.executeSalesSummary(parsedParams.data as { period?: string; startDate?: string; endDate?: string }, ctx, currencyCode, timezone);
      case 'getProfitabilitySummary':
        return this.executeProfitabilitySummary(parsedParams.data as { period?: string; startDate?: string; endDate?: string }, ctx, currencyCode, timezone);
      case 'getExpenseSummary':
        return this.executeExpenseSummary(parsedParams.data as { period?: string; startDate?: string; endDate?: string }, ctx, currencyCode, timezone);
      case 'getReceivablesSummary':
        return this.executeReceivablesSummary(ctx, currencyCode);
      case 'getPayablesSummary':
        return this.executePayablesSummary(ctx, currencyCode);
      case 'getInventoryStatus':
        return this.executeInventoryStatus(ctx, currencyCode);
      case 'getInvoiceStatus':
        return this.executeInvoiceStatus(ctx, currencyCode);
      case 'getBookkeeperStatus':
        return this.executeBookkeeperStatus(ctx);
      case 'lookupCustomer':
        return this.executeLookupCustomer(parsedParams.data as { query: string; limit?: number }, ctx);
      case 'lookupProduct':
        return this.executeLookupProduct(parsedParams.data as { query: string; limit?: number }, ctx, currencyCode);
      default:
        throw new AISafeError('ASK_NNOO_TOOL_NOT_ALLOWED', `Unsupported tool: ${toolName}`, false);
    }
  }

  private static async executeBusinessOverview(
    ctx: AskNnooToolExecutionContext,
    currencyCode: string,
    timezone: string
  ): Promise<ToolExecutionOutput> {
    const period = BusinessPeriodResolver.resolvePeriod('this_month', timezone);
    const [perfRes, posRes, bkCountRes] = await Promise.all([
      ctx.supabase.rpc('get_dashboard_performance_metrics', {
        p_business_id: ctx.businessId,
        p_start_date: period.current.start,
        p_end_date: period.current.end,
      }),
      ctx.supabase.rpc('get_dashboard_current_position', {
        p_business_id: ctx.businessId,
      }),
      ctx.supabase
        .from('ai_bookkeeping_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', ctx.businessId)
        .eq('review_action', 'pending'),
    ]);

    const rawPerf = perfRes.data || {};
    const netSalesMinor = Number(rawPerf.netSalesMinor ?? rawPerf.net_sales_minor ?? 0) || 0;
    const grossProfitMinor = Number(rawPerf.grossProfitMinor ?? rawPerf.gross_profit_minor ?? 0) || 0;
    const operatingExpensesMinor = Number(rawPerf.operatingExpensesMinor ?? rawPerf.operating_expenses_minor ?? 0) || 0;

    const rawPos = posRes.data || {};
    const accountsReceivableMinor = Number(rawPos.accountsReceivableMinor ?? rawPos.accounts_receivable_minor ?? 0) || 0;
    const accountsPayableMinor = Number(rawPos.accountsPayableMinor ?? rawPos.accounts_payable_minor ?? 0) || 0;
    const lowStockCount = Number(rawPos.lowStockCount ?? rawPos.low_stock_count ?? 0) || 0;
    const overdueInvoicesCount = Number(rawPos.overdueInvoicesCount ?? rawPos.overdue_invoices_count ?? 0) || 0;
    const pendingReviews = bkCountRes.count || 0;

    const facts: AskNnooFactReference[] = [
      {
        key: 'overview.net_sales',
        label: 'Net Sales (This Month)',
        formattedValue: formatCurrency(netSalesMinor, currencyCode),
        rawValue: netSalesMinor,
        domain: 'sales',
      },
      {
        key: 'overview.gross_profit',
        label: 'Gross Profit (This Month)',
        formattedValue: formatCurrency(grossProfitMinor, currencyCode),
        rawValue: grossProfitMinor,
        domain: 'profitability',
      },
      {
        key: 'overview.accounts_receivable',
        label: 'Accounts Receivable',
        formattedValue: formatCurrency(accountsReceivableMinor, currencyCode),
        rawValue: accountsReceivableMinor,
        domain: 'receivables',
      },
      {
        key: 'overview.accounts_payable',
        label: 'Accounts Payable',
        formattedValue: formatCurrency(accountsPayableMinor, currencyCode),
        rawValue: accountsPayableMinor,
        domain: 'payables',
      },
      {
        key: 'overview.low_stock_count',
        label: 'Low Stock Products',
        formattedValue: formatNumber(lowStockCount),
        rawValue: lowStockCount,
        domain: 'inventory',
      },
      {
        key: 'overview.overdue_invoices_count',
        label: 'Overdue Invoices',
        formattedValue: formatNumber(overdueInvoicesCount),
        rawValue: overdueInvoicesCount,
        domain: 'invoices',
      },
      {
        key: 'overview.pending_reviews_count',
        label: 'Pending Bookkeeper Reviews',
        formattedValue: formatNumber(pendingReviews),
        rawValue: pendingReviews,
        domain: 'bookkeeper',
      },
    ];

    return {
      toolName: 'getBusinessOverview',
      sourceKey: 'BUSINESS_OVERVIEW',
      defaultActionKey: 'OPEN_SALES_REPORT',
      requiredCapability: 'reports.view',
      facts,
      entities: [],
      dataSummary: `Business overview for ${period.current.label}: Net Sales ${facts[0].formattedValue}, Gross Profit ${facts[1].formattedValue}, AR ${facts[2].formattedValue}, AP ${facts[3].formattedValue}, Low Stock ${facts[4].formattedValue}, Overdue Invoices ${facts[5].formattedValue}, Pending Reviews ${facts[6].formattedValue}.`,
    };
  }

  private static async executeSalesSummary(
    params: { period?: string; startDate?: string; endDate?: string },
    ctx: AskNnooToolExecutionContext,
    currencyCode: string,
    timezone: string
  ): Promise<ToolExecutionOutput> {
    const summaryType = (params.period || 'this_month') as any;
    const period = BusinessPeriodResolver.resolvePeriod(summaryType, timezone, params.startDate, params.endDate);

    const perfRes = await ctx.supabase.rpc('get_dashboard_performance_metrics', {
      p_business_id: ctx.businessId,
      p_start_date: period.current.start,
      p_end_date: period.current.end,
    });

    const rawPerf = perfRes.data || {};
    const netSalesMinor = Number(rawPerf.netSalesMinor ?? rawPerf.net_sales_minor ?? 0) || 0;
    const grossSalesMinor = Number(rawPerf.grossSalesMinor ?? rawPerf.gross_sales_minor ?? 0) || 0;
    const refundsMinor = Number(rawPerf.refundsMinor ?? rawPerf.refunds_minor ?? 0) || 0;
    const salesCount = Number(rawPerf.salesCount ?? rawPerf.sales_count ?? 0) || 0;

    const facts: AskNnooFactReference[] = [
      {
        key: 'sales.net_sales',
        label: `Net Sales (${period.current.label})`,
        formattedValue: formatCurrency(netSalesMinor, currencyCode),
        rawValue: netSalesMinor,
        domain: 'sales',
      },
      {
        key: 'sales.gross_sales',
        label: `Gross Sales (${period.current.label})`,
        formattedValue: formatCurrency(grossSalesMinor, currencyCode),
        rawValue: grossSalesMinor,
        domain: 'sales',
      },
      {
        key: 'sales.refunds',
        label: `Refunds (${period.current.label})`,
        formattedValue: formatCurrency(refundsMinor, currencyCode),
        rawValue: refundsMinor,
        domain: 'sales',
      },
      {
        key: 'sales.count',
        label: `Sales Count (${period.current.label})`,
        formattedValue: formatNumber(salesCount),
        rawValue: salesCount,
        domain: 'sales',
      },
    ];

    return {
      toolName: 'getSalesSummary',
      sourceKey: 'SALES_REPORT',
      defaultActionKey: 'OPEN_SALES_REPORT',
      requiredCapability: 'sales.view',
      facts,
      entities: [],
      dataSummary: `Sales for ${period.current.label}: Net Sales ${facts[0].formattedValue} (${facts[3].formattedValue} transactions, ${facts[2].formattedValue} refunds).`,
    };
  }

  private static async executeProfitabilitySummary(
    params: { period?: string; startDate?: string; endDate?: string },
    ctx: AskNnooToolExecutionContext,
    currencyCode: string,
    timezone: string
  ): Promise<ToolExecutionOutput> {
    const summaryType = (params.period || 'this_month') as any;
    const period = BusinessPeriodResolver.resolvePeriod(summaryType, timezone, params.startDate, params.endDate);

    const [currentPerfRes, prevPerfRes] = await Promise.all([
      ctx.supabase.rpc('get_dashboard_performance_metrics', {
        p_business_id: ctx.businessId,
        p_start_date: period.current.start,
        p_end_date: period.current.end,
      }),
      period.previous && period.isComparable
        ? ctx.supabase.rpc('get_dashboard_performance_metrics', {
            p_business_id: ctx.businessId,
            p_start_date: period.previous.start,
            p_end_date: period.previous.end,
          })
        : Promise.resolve({ data: null, error: null }),
    ]);

    const rawPerf = currentPerfRes.data || {};
    const netSalesMinor = Number(rawPerf.netSalesMinor ?? rawPerf.net_sales_minor ?? 0) || 0;
    const cogsMinor = Number(rawPerf.cogsMinor ?? rawPerf.cogs_minor ?? 0) || 0;
    const grossProfitMinor = Number(rawPerf.grossProfitMinor ?? rawPerf.gross_profit_minor ?? 0) || 0;
    const operatingExpensesMinor = Number(rawPerf.operatingExpensesMinor ?? rawPerf.operating_expenses_minor ?? 0) || 0;
    const operatingResultMinor = Number(rawPerf.operatingResultMinor ?? rawPerf.operating_result_minor ?? 0) || 0;

    const rawPrev = prevPerfRes.data;
    const prevNetSalesMinor = rawPrev ? Number(rawPrev.netSalesMinor ?? rawPrev.net_sales_minor ?? 0) || 0 : null;
    const prevCogsMinor = rawPrev ? Number(rawPrev.cogsMinor ?? rawPrev.cogs_minor ?? 0) || 0 : null;
    const prevGrossProfitMinor = rawPrev ? Number(rawPrev.grossProfitMinor ?? rawPrev.gross_profit_minor ?? 0) || 0 : null;

    const facts: AskNnooFactReference[] = [
      {
        key: 'profitability.net_sales',
        label: `Net Sales (${period.current.label})`,
        formattedValue: formatCurrency(netSalesMinor, currencyCode),
        rawValue: netSalesMinor,
        domain: 'profitability',
      },
      {
        key: 'profitability.cogs',
        label: `Cost of Goods Sold (${period.current.label})`,
        formattedValue: formatCurrency(cogsMinor, currencyCode),
        rawValue: cogsMinor,
        domain: 'profitability',
      },
      {
        key: 'profitability.gross_profit',
        label: `Gross Profit (${period.current.label})`,
        formattedValue: formatCurrency(grossProfitMinor, currencyCode),
        rawValue: grossProfitMinor,
        domain: 'profitability',
      },
      {
        key: 'profitability.operating_expenses',
        label: `Operating Expenses (${period.current.label})`,
        formattedValue: formatCurrency(operatingExpensesMinor, currencyCode),
        rawValue: operatingExpensesMinor,
        domain: 'profitability',
      },
      {
        key: 'profitability.operating_result',
        label: `Net Operating Result (${period.current.label})`,
        formattedValue: formatCurrency(operatingResultMinor, currencyCode),
        rawValue: operatingResultMinor,
        domain: 'profitability',
      },
    ];

    let summaryText = `Profitability for ${period.current.label}: Net Sales ${facts[0].formattedValue}, COGS ${facts[1].formattedValue}, Gross Profit ${facts[2].formattedValue}, Operating Expenses ${facts[3].formattedValue}, Operating Result ${facts[4].formattedValue}.`;

    if (rawPrev && prevNetSalesMinor !== null && prevCogsMinor !== null && prevGrossProfitMinor !== null) {
      const salesDiff = netSalesMinor - prevNetSalesMinor;
      const cogsDiff = cogsMinor - prevCogsMinor;
      const gpDiff = grossProfitMinor - prevGrossProfitMinor;
      summaryText += ` Compared to previous period (${period.previous?.label}): Sales ${salesDiff >= 0 ? 'rose' : 'fell'} by ${formatCurrency(Math.abs(salesDiff), currencyCode)}, COGS ${cogsDiff >= 0 ? 'rose' : 'fell'} by ${formatCurrency(Math.abs(cogsDiff), currencyCode)}, Gross Profit ${gpDiff >= 0 ? 'rose' : 'fell'} by ${formatCurrency(Math.abs(gpDiff), currencyCode)}.`;
    }

    return {
      toolName: 'getProfitabilitySummary',
      sourceKey: 'PROFITABILITY_REPORT',
      defaultActionKey: 'OPEN_PROFITABILITY_REPORT',
      requiredCapability: 'reports.profitability.view',
      facts,
      entities: [],
      dataSummary: summaryText,
    };
  }

  private static async executeExpenseSummary(
    params: { period?: string; startDate?: string; endDate?: string },
    ctx: AskNnooToolExecutionContext,
    currencyCode: string,
    timezone: string
  ): Promise<ToolExecutionOutput> {
    const summaryType = (params.period || 'this_month') as any;
    const period = BusinessPeriodResolver.resolvePeriod(summaryType, timezone, params.startDate, params.endDate);

    const { data: expenses } = await ctx.supabase
      .from('expenses')
      .select('id, total_minor, expense_categories(id, name)')
      .eq('business_id', ctx.businessId)
      .gte('effective_date', period.current.start)
      .lte('effective_date', period.current.end);

    const categoryMap: Record<string, number> = {};
    let totalExpenseMinor = 0;

    (expenses || []).forEach((e: any) => {
      const amount = Number(e.total_minor) || 0;
      totalExpenseMinor += amount;
      const catName = e.expense_categories?.name || 'General Expense';
      categoryMap[catName] = (categoryMap[catName] || 0) + amount;
    });

    const facts: AskNnooFactReference[] = [
      {
        key: 'expenses.total_operating',
        label: `Total Operating Expenses (${period.current.label})`,
        formattedValue: formatCurrency(totalExpenseMinor, currencyCode),
        rawValue: totalExpenseMinor,
        domain: 'expenses',
      },
    ];

    // Top categories
    const sortedCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    sortedCategories.forEach(([catName, amount], idx) => {
      facts.push({
        key: `expenses.category_${idx + 1}`,
        label: `${catName} (${period.current.label})`,
        formattedValue: formatCurrency(amount, currencyCode),
        rawValue: amount,
        domain: 'expenses',
      });
    });

    return {
      toolName: 'getExpenseSummary',
      sourceKey: 'EXPENSE_REPORT',
      defaultActionKey: 'OPEN_EXPENSE_REPORT',
      requiredCapability: 'expenses.view',
      facts,
      entities: [],
      dataSummary: `Operating Expenses for ${period.current.label}: Total ${facts[0].formattedValue}. Top categories: ${sortedCategories.map(([c, a]) => `${c}: ${formatCurrency(a, currencyCode)}`).join(', ') || 'None recorded'}.`,
    };
  }

  private static async executeReceivablesSummary(
    ctx: AskNnooToolExecutionContext,
    currencyCode: string
  ): Promise<ToolExecutionOutput> {
    const { data: unpaidSales } = await ctx.supabase
      .from('sales')
      .select('id, sale_number, effective_date, total_minor, customers(id, name)')
      .eq('business_id', ctx.businessId)
      .neq('payment_status', 'paid')
      .gt('total_minor', 0)
      .order('total_minor', { ascending: false })
      .limit(10);

    const totalAr = (unpaidSales || []).reduce((sum, s) => sum + (Number(s.total_minor) || 0), 0);

    const facts: AskNnooFactReference[] = [
      {
        key: 'receivables.total_ar',
        label: 'Total Accounts Receivable',
        formattedValue: formatCurrency(totalAr, currencyCode),
        rawValue: totalAr,
        domain: 'receivables',
        asOfTimestamp: new Date().toISOString(),
      },
      {
        key: 'receivables.unpaid_sales_count',
        label: 'Unpaid Credit Sales Count',
        formattedValue: formatNumber((unpaidSales || []).length),
        rawValue: (unpaidSales || []).length,
        domain: 'receivables',
      },
    ];

    const entities: AskNnooEntityReference[] = (unpaidSales || []).map((s: any, idx) => ({
      key: `customer_receivable_${idx + 1}`,
      entityType: 'customer',
      displayName: s.customers?.name || 'Walk-in Customer',
      secondaryInfo: `Owing ${formatCurrency(s.total_minor, currencyCode)} on Sale #${s.sale_number}`,
      actionKey: 'OPEN_RECEIVABLES',
      canonicalId: s.id,
    }));

    return {
      toolName: 'getReceivablesSummary',
      sourceKey: 'RECEIVABLES',
      defaultActionKey: 'OPEN_RECEIVABLES',
      requiredCapability: 'sales.view',
      facts,
      entities,
      dataSummary: `Receivables: Total ${facts[0].formattedValue} across ${facts[1].formattedValue} unpaid sales. Top owing customers: ${entities.map((e) => `${e.displayName} (${e.secondaryInfo})`).join('; ') || 'None'}.`,
    };
  }

  private static async executePayablesSummary(
    ctx: AskNnooToolExecutionContext,
    currencyCode: string
  ): Promise<ToolExecutionOutput> {
    const [unpaidExpensesRes, unpaidReceiptsRes] = await Promise.all([
      ctx.supabase
        .from('expenses')
        .select('id, expense_number, effective_date, total_minor, suppliers(id, name)')
        .eq('business_id', ctx.businessId)
        .neq('payment_status', 'paid')
        .gt('total_minor', 0)
        .order('total_minor', { ascending: false })
        .limit(5),
      ctx.supabase
        .from('stock_receipts')
        .select('id, receipt_number, effective_date, total_minor, suppliers(id, name)')
        .eq('business_id', ctx.businessId)
        .neq('payment_status', 'paid')
        .gt('total_minor', 0)
        .order('total_minor', { ascending: false })
        .limit(5),
    ]);

    const expensePayables = unpaidExpensesRes.data || [];
    const stockPayables = unpaidReceiptsRes.data || [];

    const totalExpensePayable = expensePayables.reduce((sum, e) => sum + (Number(e.total_minor) || 0), 0);
    const totalStockPayable = stockPayables.reduce((sum, r) => sum + (Number(r.total_minor) || 0), 0);
    const totalAp = totalExpensePayable + totalStockPayable;

    const facts: AskNnooFactReference[] = [
      {
        key: 'payables.total_ap',
        label: 'Total Accounts Payable',
        formattedValue: formatCurrency(totalAp, currencyCode),
        rawValue: totalAp,
        domain: 'payables',
        asOfTimestamp: new Date().toISOString(),
      },
      {
        key: 'payables.expense_ap',
        label: 'Unpaid Expenses',
        formattedValue: formatCurrency(totalExpensePayable, currencyCode),
        rawValue: totalExpensePayable,
        domain: 'payables',
      },
      {
        key: 'payables.stock_ap',
        label: 'Unpaid Stock Purchases',
        formattedValue: formatCurrency(totalStockPayable, currencyCode),
        rawValue: totalStockPayable,
        domain: 'payables',
      },
    ];

    const entities: AskNnooEntityReference[] = [
      ...expensePayables.map((e: any, idx) => ({
        key: `payable_${idx + 1}`,
        entityType: 'supplier' as const,
        displayName: e.suppliers?.name || 'General Supplier',
        secondaryInfo: `Owed ${formatCurrency(e.total_minor, currencyCode)} on Expense #${e.expense_number}`,
        actionKey: 'OPEN_PAYABLES' as const,
        canonicalId: e.id,
      })),
      ...stockPayables.map((r: any, idx) => ({
        key: `payable_${expensePayables.length + idx + 1}`,
        entityType: 'supplier' as const,
        displayName: r.suppliers?.name || 'Stock Supplier',
        secondaryInfo: `Owed ${formatCurrency(r.total_minor, currencyCode)} on Stock Receipt #${r.receipt_number}`,
        actionKey: 'OPEN_PAYABLES' as const,
        canonicalId: r.id,
      })),
    ];

    return {
      toolName: 'getPayablesSummary',
      sourceKey: 'PAYABLES',
      defaultActionKey: 'OPEN_PAYABLES',
      requiredCapability: 'expenses.view',
      facts,
      entities,
      dataSummary: `Payables: Total ${facts[0].formattedValue} (${facts[1].formattedValue} expenses, ${facts[2].formattedValue} stock). Outstanding debts: ${entities.map((e) => `${e.displayName} (${e.secondaryInfo})`).join('; ') || 'None'}.`,
    };
  }

  private static async executeInventoryStatus(
    ctx: AskNnooToolExecutionContext,
    currencyCode: string
  ): Promise<ToolExecutionOutput> {
    const { data: positions } = await ctx.supabase
      .from('inventory_positions')
      .select('id, quantity_on_hand, inventory_value_minor, catalog_items(id, name, sku, low_stock_threshold)')
      .eq('business_id', ctx.businessId);

    const items = positions || [];
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValueMinor = 0;

    const lowStockEntities: AskNnooEntityReference[] = [];

    items.forEach((p: any, idx) => {
      const qty = Number(p.quantity_on_hand) || 0;
      const threshold = Number(p.catalog_items?.low_stock_threshold) || 5;
      const val = Number(p.inventory_value_minor) || 0;
      totalValueMinor += val;

      if (qty <= 0) {
        outOfStockCount++;
        lowStockEntities.push({
          key: `product_${idx + 1}`,
          entityType: 'product',
          displayName: p.catalog_items?.name || 'Product',
          secondaryInfo: 'Out of Stock (0 on hand)',
          actionKey: 'OPEN_LOW_STOCK',
          canonicalId: p.catalog_items?.id,
        });
      } else if (qty <= threshold) {
        lowStockCount++;
        lowStockEntities.push({
          key: `product_${idx + 1}`,
          entityType: 'product',
          displayName: p.catalog_items?.name || 'Product',
          secondaryInfo: `Low Stock (${qty} remaining, threshold ${threshold})`,
          actionKey: 'OPEN_LOW_STOCK',
          canonicalId: p.catalog_items?.id,
        });
      }
    });

    const isAuthorizedForCost = ['owner', 'business_admin', 'manager', 'accountant'].includes(ctx.userRole);

    const facts: AskNnooFactReference[] = [
      {
        key: 'inventory.total_items_tracked',
        label: 'Tracked Products',
        formattedValue: formatNumber(items.length),
        rawValue: items.length,
        domain: 'inventory',
      },
      {
        key: 'inventory.low_stock_count',
        label: 'Low Stock Products',
        formattedValue: formatNumber(lowStockCount),
        rawValue: lowStockCount,
        domain: 'inventory',
      },
      {
        key: 'inventory.out_of_stock_count',
        label: 'Out of Stock Products',
        formattedValue: formatNumber(outOfStockCount),
        rawValue: outOfStockCount,
        domain: 'inventory',
      },
    ];

    if (isAuthorizedForCost) {
      facts.push({
        key: 'inventory.total_asset_value',
        label: 'Total Inventory Valuation',
        formattedValue: formatCurrency(totalValueMinor, currencyCode),
        rawValue: totalValueMinor,
        domain: 'inventory',
        asOfTimestamp: new Date().toISOString(),
      });
    }

    return {
      toolName: 'getInventoryStatus',
      sourceKey: 'INVENTORY',
      defaultActionKey: lowStockCount > 0 || outOfStockCount > 0 ? 'OPEN_LOW_STOCK' : 'OPEN_INVENTORY',
      requiredCapability: 'inventory.view',
      facts,
      entities: lowStockEntities.slice(0, 10),
      dataSummary: `Inventory: ${facts[0].formattedValue} items tracked. Low stock: ${facts[1].formattedValue}, Out of stock: ${facts[2].formattedValue}.${isAuthorizedForCost ? ` Total Valuation: ${formatCurrency(totalValueMinor, currencyCode)}.` : ''} Urgent restock: ${lowStockEntities.map((e) => `${e.displayName} (${e.secondaryInfo})`).join('; ') || 'All stock levels healthy'}.`,
    };
  }

  private static async executeInvoiceStatus(
    ctx: AskNnooToolExecutionContext,
    currencyCode: string
  ): Promise<ToolExecutionOutput> {
    const { data: invoices } = await ctx.supabase
      .from('invoices')
      .select('id, invoice_number, invoice_status, total_minor, due_date, customers(id, name)')
      .eq('business_id', ctx.businessId)
      .neq('invoice_status', 'paid')
      .order('due_date', { ascending: true })
      .limit(10);

    const nowIso = new Date().toISOString().split('T')[0];
    let overdueCount = 0;
    let totalOutstanding = 0;

    const entities: AskNnooEntityReference[] = (invoices || []).map((inv: any, idx) => {
      const amount = Number(inv.total_minor) || 0;
      totalOutstanding += amount;
      const isOverdue = inv.due_date && inv.due_date < nowIso;
      if (isOverdue) overdueCount++;

      return {
        key: `invoice_${idx + 1}`,
        entityType: 'invoice',
        displayName: `Invoice #${inv.invoice_number} (${inv.customers?.name || 'Customer'})`,
        secondaryInfo: `${formatCurrency(amount, currencyCode)} · ${isOverdue ? 'OVERDUE' : 'Due ' + inv.due_date}`,
        actionKey: isOverdue ? 'OPEN_OVERDUE_INVOICES' : 'OPEN_INVOICES',
        canonicalId: inv.id,
      };
    });

    const facts: AskNnooFactReference[] = [
      {
        key: 'invoices.unpaid_count',
        label: 'Unpaid Invoices Count',
        formattedValue: formatNumber((invoices || []).length),
        rawValue: (invoices || []).length,
        domain: 'invoices',
      },
      {
        key: 'invoices.overdue_count',
        label: 'Overdue Invoices Count',
        formattedValue: formatNumber(overdueCount),
        rawValue: overdueCount,
        domain: 'invoices',
      },
      {
        key: 'invoices.total_outstanding',
        label: 'Total Unpaid Invoices Amount',
        formattedValue: formatCurrency(totalOutstanding, currencyCode),
        rawValue: totalOutstanding,
        domain: 'invoices',
      },
    ];

    return {
      toolName: 'getInvoiceStatus',
      sourceKey: 'INVOICES',
      defaultActionKey: overdueCount > 0 ? 'OPEN_OVERDUE_INVOICES' : 'OPEN_INVOICES',
      requiredCapability: 'invoices.view',
      facts,
      entities,
      dataSummary: `Invoices: ${(invoices || []).length} unpaid (${facts[1].formattedValue} overdue) totaling ${facts[2].formattedValue}. Invoices needing review: ${entities.map((e) => `${e.displayName} (${e.secondaryInfo})`).join('; ') || 'None'}.`,
    };
  }

  private static async executeBookkeeperStatus(
    ctx: AskNnooToolExecutionContext
  ): Promise<ToolExecutionOutput> {
    const { data: pendingReviews, count } = await ctx.supabase
      .from('ai_bookkeeping_reviews')
      .select('id, ai_operation_kind, ai_bookkeeping_classifications(description, amount_minor, currency_code)', { count: 'exact' })
      .eq('business_id', ctx.businessId)
      .eq('review_action', 'pending')
      .limit(5);

    const pendingCount = count || 0;
    const facts: AskNnooFactReference[] = [
      {
        key: 'bookkeeper.pending_reviews_count',
        label: 'Pending Bookkeeper Reviews',
        formattedValue: formatNumber(pendingCount),
        rawValue: pendingCount,
        domain: 'bookkeeper',
      },
    ];

    const entities: AskNnooEntityReference[] = (pendingReviews || []).map((r: any, idx) => ({
      key: `bookkeeper_item_${idx + 1}`,
      entityType: 'expense',
      displayName: r.ai_bookkeeping_classifications?.description || 'Bookkeeping Entry',
      secondaryInfo: `Suggested: ${r.ai_operation_kind} (${formatCurrency(r.ai_bookkeeping_classifications?.amount_minor || 0, r.ai_bookkeeping_classifications?.currency_code || 'NGN')})`,
      actionKey: 'OPEN_AI_BOOKKEEPER',
      canonicalId: r.id,
    }));

    return {
      toolName: 'getBookkeeperStatus',
      sourceKey: 'BOOKKEEPER',
      defaultActionKey: 'OPEN_AI_BOOKKEEPER',
      requiredCapability: 'bookkeeper.view',
      facts,
      entities,
      dataSummary: `AI Bookkeeper: ${facts[0].formattedValue} items waiting for human confirmation. Items: ${entities.map((e) => `${e.displayName} (${e.secondaryInfo})`).join('; ') || 'Inbox is clear'}.`,
    };
  }

  private static async executeLookupCustomer(
    params: { query: string; limit?: number },
    ctx: AskNnooToolExecutionContext
  ): Promise<ToolExecutionOutput> {
    const limit = Math.min(params.limit || 5, 10);
    const { data: customers } = await ctx.supabase
      .from('customers')
      .select('id, name, customer_type, status')
      .eq('business_id', ctx.businessId)
      .ilike('name', `%${params.query}%`)
      .limit(limit);

    const entities: AskNnooEntityReference[] = (customers || []).map((c: any, idx) => ({
      key: `customer_${idx + 1}`,
      entityType: 'customer',
      displayName: c.name,
      secondaryInfo: `Customer (${c.status})`,
      actionKey: 'OPEN_RECEIVABLES',
      canonicalId: c.id,
    }));

    const facts: AskNnooFactReference[] = [
      {
        key: 'customers.match_count',
        label: 'Matching Customers Count',
        formattedValue: formatNumber(entities.length),
        rawValue: entities.length,
        domain: 'customers',
      },
    ];

    return {
      toolName: 'lookupCustomer',
      sourceKey: 'RECEIVABLES',
      defaultActionKey: 'OPEN_RECEIVABLES',
      requiredCapability: 'customers.view',
      facts,
      entities,
      dataSummary: `Found ${entities.length} matching customers for '${params.query}': ${entities.map((e) => e.displayName).join(', ') || 'No matches'}.`,
    };
  }

  private static async executeLookupProduct(
    params: { query: string; limit?: number },
    ctx: AskNnooToolExecutionContext,
    currencyCode: string
  ): Promise<ToolExecutionOutput> {
    const limit = Math.min(params.limit || 5, 10);
    const { data: items } = await ctx.supabase
      .from('catalog_items')
      .select('id, name, sku, selling_price_minor, inventory_positions(quantity_on_hand)')
      .eq('business_id', ctx.businessId)
      .ilike('name', `%${params.query}%`)
      .limit(limit);

    const entities: AskNnooEntityReference[] = (items || []).map((item: any, idx) => {
      const pos = Array.isArray(item.inventory_positions) ? item.inventory_positions[0] : item.inventory_positions;
      const qty = pos ? Number(pos.quantity_on_hand) : 0;
      const price = Number(item.selling_price_minor) || 0;

      return {
        key: `product_${idx + 1}`,
        entityType: 'product',
        displayName: item.name,
        secondaryInfo: `Stock: ${qty} units · Price: ${formatCurrency(price, currencyCode)}`,
        actionKey: 'OPEN_INVENTORY',
        canonicalId: item.id,
      };
    });

    const facts: AskNnooFactReference[] = [
      {
        key: 'products.match_count',
        label: 'Matching Products Count',
        formattedValue: formatNumber(entities.length),
        rawValue: entities.length,
        domain: 'products',
      },
    ];

    return {
      toolName: 'lookupProduct',
      sourceKey: 'INVENTORY',
      defaultActionKey: 'OPEN_INVENTORY',
      requiredCapability: 'products.view',
      facts,
      entities,
      dataSummary: `Found ${entities.length} matching products for '${params.query}': ${entities.map((e) => `${e.displayName} (${e.secondaryInfo})`).join('; ') || 'No matches'}.`,
    };
  }
}
