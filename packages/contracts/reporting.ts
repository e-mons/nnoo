export type PerformanceMetrics = {
  grossSalesMinor: string;
  salesCount: number;
  refundsMinor: string;
  netSalesMinor: string;
  customerPaymentsReceivedMinor: string;
  cogsMinor: string;
  grossProfitMinor: string;
  operatingExpensesMinor: string;
  inventoryAdjustmentGainMinor: string;
  inventoryShrinkageLossMinor: string;
  operatingResultMinor: string;
};

export type CurrentPositionMetrics = {
  accountsReceivableMinor: string;
  accountsPayableMinor: string;
  inventoryValueMinor: string;
  lowStockCount: number;
  outOfStockCount: number;
  overdueInvoicesCount: number;
};

export type SalesTrendPoint = {
  date: string;
  netSalesMinor: string;
  expensesMinor: string;
};

export type RecentActivityEvent = {
  id: string;
  eventType: 'sale' | 'sale_payment' | 'operating_expense' | 'expense_payment' | string;
  occurredAt: string;
  description: string;
  amountMinor: string;
  currencyCode: string;
};

export type BusinessDashboardSummary = {
  periodStart: string;
  periodEnd: string;
  performance: PerformanceMetrics;
  currentPosition: CurrentPositionMetrics;
  salesTrend: SalesTrendPoint[];
  recentActivity: RecentActivityEvent[];
};
