export type Money = {
  amountMinor: string; // The integer amount in minor units (e.g., kobo/cents) represented as a string to avoid JSON BigInt issues.
  currencyCode: string; // e.g., 'NGN'
};

export const LEDGER_ACCOUNT_CLASSES = [
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense',
] as const;
export type LedgerAccountClass = typeof LEDGER_ACCOUNT_CLASSES[number];

export const SYSTEM_LEDGER_ACCOUNT_KEYS = [
  'cash_and_cash_equivalents',
  'accounts_receivable',
  'inventory_asset',
  'accounts_payable',
  'owner_equity',
  'sales_revenue',
  'cost_of_goods_sold',
  'operating_expense',
  'inventory_adjustment_gain',
  'inventory_shrinkage_loss',
] as const;
export type SystemLedgerAccountKey = typeof SYSTEM_LEDGER_ACCOUNT_KEYS[number];

export type LedgerAccount = {
  id: string;
  businessId: string;
  code: string | null;
  name: string;
  accountClass: LedgerAccountClass;
  systemKey: SystemLedgerAccountKey | null;
  normalBalance: 'debit' | 'credit' | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JournalEntry = {
  id: string;
  businessId: string;
  currencyCode: string;
  sourceEventType: string;
  sourceEventId: string;
  idempotencyKey: string;
  occurredAt: string;
  effectiveDate: string;
  description: string | null;
  createdByUserId: string | null;
  reversedByEntryId: string | null;
  reversalOfEntryId: string | null;
  createdAt: string;
};

export type JournalLine = {
  id: string;
  journalEntryId: string;
  businessId: string;
  ledgerAccountId: string;
  debitMinor: string;
  creditMinor: string;
  memo: string | null;
  lineOrder: number | null;
  createdAt: string;
};

export type FinancialPostingDraftLine = {
  ledgerAccountId: string;
  debitMinor: string;
  creditMinor: string;
  memo?: string;
};

export type FinancialPostingDraft = {
  businessId: string;
  currencyCode: string;
  sourceEventType: string;
  sourceEventId: string;
  idempotencyKey: string;
  occurredAt: string; // ISO datetime
  effectiveDate: string; // YYYY-MM-DD
  description?: string;
  createdByUserId?: string;
  lines: FinancialPostingDraftLine[];
};

export type FinancialPostingResult = {
  entry: JournalEntry;
  lines: JournalLine[];
};
