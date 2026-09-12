import { z } from 'zod';
import {
  LEDGER_ACCOUNT_CLASSES,
  SYSTEM_LEDGER_ACCOUNT_KEYS,
} from '@nnoo/contracts';

export const moneySchema = z.object({
  amountMinor: z.string().regex(/^\d+$/, 'amountMinor must be a positive integer string'),
  currencyCode: z.string().length(3).toUpperCase(),
});

export const ledgerAccountClassSchema = z.enum(LEDGER_ACCOUNT_CLASSES);
export const systemLedgerAccountKeySchema = z.enum(SYSTEM_LEDGER_ACCOUNT_KEYS);

export const financialPostingDraftLineSchema = z.object({
  ledgerAccountId: z.string().uuid(),
  debitMinor: z.string().regex(/^\d+$/),
  creditMinor: z.string().regex(/^\d+$/),
  memo: z.string().max(255).optional(),
}).refine(
  (data) => {
    const debit = BigInt(data.debitMinor);
    const credit = BigInt(data.creditMinor);
    return (debit > 0n && credit === 0n) || (debit === 0n && credit > 0n);
  },
  {
    message: 'A line must have either a positive debit or a positive credit, but not both or neither.',
  }
);

export const financialPostingDraftSchema = z.object({
  businessId: z.string().uuid(),
  currencyCode: z.string().length(3).toUpperCase(),
  sourceEventType: z.string().min(1).max(100),
  sourceEventId: z.string().min(1).max(100),
  idempotencyKey: z.string().min(1).max(100),
  occurredAt: z.string().datetime(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  description: z.string().max(1000).optional(),
  createdByUserId: z.string().uuid().optional(),
  lines: z.array(financialPostingDraftLineSchema).min(2, 'At least two lines are required'),
}).refine(
  (data) => {
    let totalDebit = 0n;
    let totalCredit = 0n;
    for (const line of data.lines) {
      totalDebit += BigInt(line.debitMinor);
      totalCredit += BigInt(line.creditMinor);
    }
    return totalDebit === totalCredit && totalDebit > 0n;
  },
  {
    message: 'Journal entry must balance (total debits = total credits) and be greater than 0',
  }
);

export type FinancialPostingDraft = z.infer<typeof financialPostingDraftSchema>;
export type FinancialPostingDraftLine = z.infer<typeof financialPostingDraftLineSchema>;
export type { FinancialPostingResult } from '@nnoo/contracts';

