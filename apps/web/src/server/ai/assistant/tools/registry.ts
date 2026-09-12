import 'server-only';
import { z } from 'zod';
import type {
  AskNnooToolKey,
  AskNnooActionKey,
  AskNnooActionDefinition,
  AskNnooSourceKey,
} from '@nnoo/contracts';
import { ASK_NNOO_ACTION_REGISTRY } from '@nnoo/contracts';

export interface AskNnooToolDefinition<TParams = unknown> {
  name: AskNnooToolKey;
  description: string;
  requiredModule: 'reports' | 'sales' | 'expenses' | 'inventory' | 'invoices' | 'bookkeeper' | 'customers' | 'products' | 'insights';
  requiredCapability: string;
  sourceKey: AskNnooSourceKey;
  defaultActionKey: AskNnooActionKey;
  paramSchema: z.ZodType<TParams>;
}

export const PeriodParamSchema = z.object({
  period: z.enum(['today', 'this_week', 'this_month', 'custom']).default('this_month'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const SearchParamSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(20).default(5),
});

export const EmptyParamSchema = z.object({});

export const ASK_NNOO_TOOLS: Record<AskNnooToolKey, AskNnooToolDefinition> = {
  getBusinessOverview: {
    name: 'getBusinessOverview',
    description: 'Retrieves an executive operational overview including net sales, gross profit, outstanding receivables, low stock alerts, and pending reviews.',
    requiredModule: 'reports',
    requiredCapability: 'reports.view',
    sourceKey: 'BUSINESS_OVERVIEW',
    defaultActionKey: 'OPEN_SALES_REPORT',
    paramSchema: EmptyParamSchema,
  },
  getSalesSummary: {
    name: 'getSalesSummary',
    description: 'Retrieves verified Net Sales, gross sales, refund amounts, and transaction counts for a specified period (today, this_week, this_month, or custom).',
    requiredModule: 'sales',
    requiredCapability: 'sales.view',
    sourceKey: 'SALES_REPORT',
    defaultActionKey: 'OPEN_SALES_REPORT',
    paramSchema: PeriodParamSchema,
  },
  getProfitabilitySummary: {
    name: 'getProfitabilitySummary',
    description: 'Retrieves gross profit, COGS, operating expenses, and net operating result for a period. Strictly requires financial/profitability reporting permission.',
    requiredModule: 'reports',
    requiredCapability: 'reports.profitability.view',
    sourceKey: 'PROFITABILITY_REPORT',
    defaultActionKey: 'OPEN_PROFITABILITY_REPORT',
    paramSchema: PeriodParamSchema,
  },
  getExpenseSummary: {
    name: 'getExpenseSummary',
    description: 'Retrieves total operating expenses and breakdown by expense category for a specified period.',
    requiredModule: 'expenses',
    requiredCapability: 'expenses.view',
    sourceKey: 'EXPENSE_REPORT',
    defaultActionKey: 'OPEN_EXPENSE_REPORT',
    paramSchema: PeriodParamSchema,
  },
  getReceivablesSummary: {
    name: 'getReceivablesSummary',
    description: 'Retrieves total accounts receivable and top owing customers with outstanding balances.',
    requiredModule: 'sales',
    requiredCapability: 'sales.view',
    sourceKey: 'RECEIVABLES',
    defaultActionKey: 'OPEN_RECEIVABLES',
    paramSchema: EmptyParamSchema,
  },
  getPayablesSummary: {
    name: 'getPayablesSummary',
    description: 'Retrieves total accounts payable and top outstanding supplier debts from unpaid expenses and stock receipts.',
    requiredModule: 'expenses',
    requiredCapability: 'expenses.view',
    sourceKey: 'PAYABLES',
    defaultActionKey: 'OPEN_PAYABLES',
    paramSchema: EmptyParamSchema,
  },
  getInventoryStatus: {
    name: 'getInventoryStatus',
    description: 'Retrieves low stock items, out of stock items, and current stock positions.',
    requiredModule: 'inventory',
    requiredCapability: 'inventory.view',
    sourceKey: 'INVENTORY',
    defaultActionKey: 'OPEN_INVENTORY',
    paramSchema: EmptyParamSchema,
  },
  getInvoiceStatus: {
    name: 'getInvoiceStatus',
    description: 'Retrieves summary of unpaid, partially paid, and overdue sales invoices.',
    requiredModule: 'invoices',
    requiredCapability: 'invoices.view',
    sourceKey: 'INVOICES',
    defaultActionKey: 'OPEN_INVOICES',
    paramSchema: EmptyParamSchema,
  },
  getBookkeeperStatus: {
    name: 'getBookkeeperStatus',
    description: 'Retrieves count of pending AI Bookkeeper classification suggestions awaiting human review.',
    requiredModule: 'bookkeeper',
    requiredCapability: 'bookkeeper.view',
    sourceKey: 'BOOKKEEPER',
    defaultActionKey: 'OPEN_AI_BOOKKEEPER',
    paramSchema: EmptyParamSchema,
  },
  lookupCustomer: {
    name: 'lookupCustomer',
    description: 'Searches same-business customer records by name or invoice reference (bounded, up to 5 matches).',
    requiredModule: 'customers',
    requiredCapability: 'customers.view',
    sourceKey: 'RECEIVABLES',
    defaultActionKey: 'OPEN_RECEIVABLES',
    paramSchema: SearchParamSchema,
  },
  lookupProduct: {
    name: 'lookupProduct',
    description: 'Searches same-business catalog items by name to check stock availability and price (bounded, up to 5 matches).',
    requiredModule: 'products',
    requiredCapability: 'products.view',
    sourceKey: 'INVENTORY',
    defaultActionKey: 'OPEN_INVENTORY',
    paramSchema: SearchParamSchema,
  },
};
