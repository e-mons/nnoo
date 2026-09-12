import 'server-only';
import type {
  VerifiedFactBundle,
  BusinessInsightSignal,
  BusinessInsightSignalDirection,
  BusinessInsightActionKey,
  BusinessInsightActionDefinition,
} from '@nnoo/contracts';

export const ACTION_REGISTRY: Record<BusinessInsightActionKey, BusinessInsightActionDefinition> = {
  OPEN_SALES_REPORT: {
    key: 'OPEN_SALES_REPORT',
    label: 'View Sales Report',
    routePath: '/reports/sales',
    description: 'Review itemized daily sales, payment breakdowns, and refunds.',
  },
  OPEN_EXPENSE_REPORT: {
    key: 'OPEN_EXPENSE_REPORT',
    label: 'View Expense Report',
    routePath: '/reports/expenses',
    description: 'Inspect category spending and operating expenditure breakdown.',
  },
  OPEN_PROFITABILITY_REPORT: {
    key: 'OPEN_PROFITABILITY_REPORT',
    label: 'View Profitability Report',
    routePath: '/reports/profitability',
    description: 'Analyze gross margin, operating results, and cost of goods sold.',
  },
  OPEN_RECEIVABLES: {
    key: 'OPEN_RECEIVABLES',
    label: 'View Accounts Receivable',
    routePath: '/reports/receivables',
    description: 'Review outstanding customer balances and credit terms.',
  },
  OPEN_PAYABLES: {
    key: 'OPEN_PAYABLES',
    label: 'View Accounts Payable',
    routePath: '/reports/payables',
    description: 'Review outstanding supplier bills and purchase payables.',
  },
  OPEN_INVENTORY: {
    key: 'OPEN_INVENTORY',
    label: 'View Inventory Position',
    routePath: '/reports/inventory',
    description: 'Review current stock valuation, movements, and shrinkage.',
  },
  OPEN_LOW_STOCK: {
    key: 'OPEN_LOW_STOCK',
    label: 'Review Low Stock Items',
    routePath: '/inventory',
    description: 'Inspect inventory items running low and prepare purchase receipts.',
  },
  OPEN_OVERDUE_INVOICES: {
    key: 'OPEN_OVERDUE_INVOICES',
    label: 'Review Overdue Invoices',
    routePath: '/invoices',
    description: 'Follow up on issued customer invoices that have passed due dates.',
  },
};

/**
 * Helper to format minor currency units into human-readable Naira/Currency strings.
 */
function formatMoney(amountMinor: number, currency: string = 'NGN'): string {
  const symbol = currency === 'NGN' ? '₦' : `${currency} `;
  const absVal = Math.abs(amountMinor) / 100;
  const formatted = absVal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amountMinor < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

/**
 * Deterministic Signal Engine that derives mathematical facts and directions.
 * GEMINI DOES NOT CALCULATE DIRECTIONS, DELTAS, OR ACTIONS.
 */
export class DeterministicInsightSignalEngine {
  /**
   * Generates deterministic signals from a verified fact bundle.
   */
  public static deriveSignals(bundle: VerifiedFactBundle): {
    signals: BusinessInsightSignal[];
    allowableActions: BusinessInsightActionKey[];
  } {
    const { performance, previousPerformance, currentPosition, currencyCode, comparison } = bundle;
    const signals: BusinessInsightSignal[] = [];
    const allowableActions: Set<BusinessInsightActionKey> = new Set();

    // Always permit primary financial reports
    allowableActions.add('OPEN_SALES_REPORT');
    allowableActions.add('OPEN_EXPENSE_REPORT');
    allowableActions.add('OPEN_PROFITABILITY_REPORT');

    // 1. NET_SALES_CHANGE
    let salesDir: BusinessInsightSignalDirection = 'NOT_COMPARABLE';
    let salesChangeDesc = 'No prior period data for comparison';

    if (previousPerformance && comparison?.isComparable) {
      const cur = performance.netSalesMinor;
      const prev = previousPerformance.netSalesMinor;
      const delta = cur - prev;

      if (cur > prev) salesDir = 'UP';
      else if (cur < prev) salesDir = 'DOWN';
      else salesDir = 'UNCHANGED';

      if (prev > 0) {
        const pct = Math.round((delta / prev) * 100);
        salesChangeDesc = `${pct >= 0 ? '+' : ''}${pct}% vs prior period (${formatMoney(prev, currencyCode)})`;
      } else if (prev === 0 && cur > 0) {
        salesChangeDesc = `+100% vs prior period (₦0.00)`;
      } else {
        salesChangeDesc = `Identical to prior period (${formatMoney(prev, currencyCode)})`;
      }
    }

    signals.push({
      signalKey: 'NET_SALES_CHANGE',
      type: 'performance',
      direction: salesDir,
      title: 'Net Sales',
      formattedMetric: formatMoney(performance.netSalesMinor, currencyCode),
      changeDescription: salesChangeDesc,
      sourceProvenance: 'REPORTING_NET_SALES',
      actionKey: 'OPEN_SALES_REPORT',
    });

    // 2. REFUNDS_PRESENT
    if (performance.refundsMinor > 0) {
      signals.push({
        signalKey: 'REFUNDS_PRESENT',
        type: 'attention',
        direction: 'UP',
        title: 'Customer Refunds',
        formattedMetric: formatMoney(performance.refundsMinor, currencyCode),
        changeDescription: 'Refunds issued in this period',
        sourceProvenance: 'REPORTING_REFUNDS',
        actionKey: 'OPEN_SALES_REPORT',
      });
    }

    // 3. GROSS_PROFIT_CHANGE
    let gpDir: BusinessInsightSignalDirection = 'NOT_COMPARABLE';
    let gpChangeDesc = 'No prior period comparison';

    if (previousPerformance && comparison?.isComparable) {
      const cur = performance.grossProfitMinor;
      const prev = previousPerformance.grossProfitMinor;
      const delta = cur - prev;

      if (cur > prev) gpDir = 'UP';
      else if (cur < prev) gpDir = 'DOWN';
      else gpDir = 'UNCHANGED';

      if (prev > 0) {
        const pct = Math.round((delta / prev) * 100);
        gpChangeDesc = `${pct >= 0 ? '+' : ''}${pct}% vs prior period`;
      } else {
        gpChangeDesc = `${delta >= 0 ? '+' : ''}${formatMoney(delta, currencyCode)} change`;
      }
    }

    signals.push({
      signalKey: 'GROSS_PROFIT_CHANGE',
      type: 'performance',
      direction: gpDir,
      title: 'Gross Profit',
      formattedMetric: formatMoney(performance.grossProfitMinor, currencyCode),
      changeDescription: gpChangeDesc,
      sourceProvenance: 'REPORTING_GROSS_PROFIT',
      actionKey: 'OPEN_PROFITABILITY_REPORT',
    });

    // 4. OPERATING_EXPENSE_CHANGE
    let expDir: BusinessInsightSignalDirection = 'NOT_COMPARABLE';
    let expChangeDesc = 'No prior period comparison';

    if (previousPerformance && comparison?.isComparable) {
      const cur = performance.operatingExpensesMinor;
      const prev = previousPerformance.operatingExpensesMinor;
      const delta = cur - prev;

      if (cur > prev) expDir = 'UP';
      else if (cur < prev) expDir = 'DOWN';
      else expDir = 'UNCHANGED';

      if (prev > 0) {
        const pct = Math.round((delta / prev) * 100);
        expChangeDesc = `${pct >= 0 ? '+' : ''}${pct}% vs prior period`;
      } else {
        expChangeDesc = `${delta >= 0 ? '+' : ''}${formatMoney(delta, currencyCode)} change`;
      }
    }

    signals.push({
      signalKey: 'OPERATING_EXPENSE_CHANGE',
      type: 'performance',
      direction: expDir,
      title: 'Operating Expenses',
      formattedMetric: formatMoney(performance.operatingExpensesMinor, currencyCode),
      changeDescription: expChangeDesc,
      sourceProvenance: 'REPORTING_OPERATING_EXPENSES',
      actionKey: 'OPEN_EXPENSE_REPORT',
    });

    // 5. OPERATING_RESULT_CHANGE
    let resDir: BusinessInsightSignalDirection = 'NOT_COMPARABLE';
    if (previousPerformance && comparison?.isComparable) {
      const cur = performance.operatingResultMinor;
      const prev = previousPerformance.operatingResultMinor;
      if (cur > prev) resDir = 'UP';
      else if (cur < prev) resDir = 'DOWN';
      else resDir = 'UNCHANGED';
    }

    signals.push({
      signalKey: 'OPERATING_RESULT_CHANGE',
      type: 'performance',
      direction: resDir,
      title: 'Operating Result',
      formattedMetric: formatMoney(performance.operatingResultMinor, currencyCode),
      changeDescription: 'Net operating result after expenses',
      sourceProvenance: 'REPORTING_OPERATING_RESULT',
      actionKey: 'OPEN_PROFITABILITY_REPORT',
    });

    // 6. OUTSTANDING_RECEIVABLES
    if (currentPosition.accountsReceivableMinor > 0) {
      signals.push({
        signalKey: 'OUTSTANDING_RECEIVABLES',
        type: 'position',
        direction: 'UP',
        title: 'Money Customers Owe (AR)',
        formattedMetric: formatMoney(currentPosition.accountsReceivableMinor, currencyCode),
        changeDescription: 'Current unpaid customer balances',
        sourceProvenance: 'REPORTING_ACCOUNTS_RECEIVABLE',
        actionKey: 'OPEN_RECEIVABLES',
      });
      allowableActions.add('OPEN_RECEIVABLES');
    }

    // 7. OUTSTANDING_PAYABLES
    if (currentPosition.accountsPayableMinor > 0) {
      signals.push({
        signalKey: 'OUTSTANDING_PAYABLES',
        type: 'position',
        direction: 'UP',
        title: 'Money Owed to Suppliers (AP)',
        formattedMetric: formatMoney(currentPosition.accountsPayableMinor, currencyCode),
        changeDescription: 'Current unpaid supplier bills',
        sourceProvenance: 'REPORTING_ACCOUNTS_PAYABLE',
        actionKey: 'OPEN_PAYABLES',
      });
      allowableActions.add('OPEN_PAYABLES');
    }

    // 8. INVENTORY_POSITION
    if (currentPosition.inventoryValueMinor > 0) {
      signals.push({
        signalKey: 'INVENTORY_POSITION',
        type: 'position',
        direction: 'UNCHANGED',
        title: 'Total Stock Valuation',
        formattedMetric: formatMoney(currentPosition.inventoryValueMinor, currencyCode),
        changeDescription: 'Total valuation of on-hand inventory',
        sourceProvenance: 'REPORTING_INVENTORY_VALUE',
        actionKey: 'OPEN_INVENTORY',
      });
      allowableActions.add('OPEN_INVENTORY');
    }

    // 9. LOW_STOCK_PRESENT
    if (currentPosition.lowStockCount > 0) {
      signals.push({
        signalKey: 'LOW_STOCK_PRESENT',
        type: 'attention',
        direction: 'UP',
        title: 'Low Stock Items',
        formattedMetric: `${currentPosition.lowStockCount} items`,
        changeDescription: 'Items at or below threshold',
        sourceProvenance: 'REPORTING_LOW_STOCK',
        actionKey: 'OPEN_LOW_STOCK',
      });
      allowableActions.add('OPEN_LOW_STOCK');
    }

    // 10. OUT_OF_STOCK_PRESENT
    if (currentPosition.outOfStockCount > 0) {
      signals.push({
        signalKey: 'OUT_OF_STOCK_PRESENT',
        type: 'attention',
        direction: 'UP',
        title: 'Out of Stock Items',
        formattedMetric: `${currentPosition.outOfStockCount} items`,
        changeDescription: 'Items with zero quantity on hand',
        sourceProvenance: 'REPORTING_OUT_OF_STOCK',
        actionKey: 'OPEN_LOW_STOCK',
      });
      allowableActions.add('OPEN_LOW_STOCK');
    }

    // 11. OVERDUE_INVOICES_PRESENT
    if (currentPosition.overdueInvoicesCount > 0) {
      signals.push({
        signalKey: 'OVERDUE_INVOICES_PRESENT',
        type: 'attention',
        direction: 'UP',
        title: 'Overdue Invoices',
        formattedMetric: `${currentPosition.overdueInvoicesCount} invoices`,
        changeDescription: 'Issued invoices past due date',
        sourceProvenance: 'REPORTING_OVERDUE_INVOICES',
        actionKey: 'OPEN_OVERDUE_INVOICES',
      });
      allowableActions.add('OPEN_OVERDUE_INVOICES');
    }

    return {
      signals,
      allowableActions: Array.from(allowableActions),
    };
  }
}
