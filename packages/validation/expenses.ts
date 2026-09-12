import { z } from 'zod';
import { PAYMENT_METHODS } from '@nnoo/contracts';

export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);

export const CreateExpensePaymentSchema = z.object({
  amountMinor: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, "Payment amount must be greater than 0"),
  paymentMethod: PaymentMethodSchema,
  reference: z.string().optional(),
});

export const CreateExpenseDraftSchema = z.object({
  idempotencyKey: z.string().optional(),
  categoryId: z.string().uuid("Invalid category"),
  supplierId: z.string().uuid("Invalid supplier").optional().nullable(),
  currencyCode: z.string().min(3),
  totalMinor: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, "Expense total must be greater than 0"),
  occurredAt: z.string().datetime().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().nullable(),
  description: z.string().min(1, "Description is required"),
  externalReference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receiptPath: z.string().optional().nullable(),
  payments: z.array(CreateExpensePaymentSchema).optional(),
}).refine((data) => {
  const total = Number(data.totalMinor);
  const paid = data.payments?.reduce((acc, p) => acc + Number(p.amountMinor), 0) || 0;
  
  if (paid > total) {
    return false;
  }
  return true;
}, {
  message: "Initial payments cannot exceed total expense amount",
  path: ["payments"],
}).refine((data) => {
  const total = Number(data.totalMinor);
  const paid = data.payments?.reduce((acc, p) => acc + Number(p.amountMinor), 0) || 0;
  
  if (paid < total && !data.supplierId) {
    return false;
  }
  return true;
}, {
  message: "A supplier must be specified for expenses with an outstanding balance",
  path: ["supplierId"],
});

export const RecordExpensePaymentDraftSchema = z.object({
  idempotencyKey: z.string().optional(),
  expenseId: z.string().uuid(),
  amountMinor: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, "Payment amount must be greater than 0"),
  paymentMethod: PaymentMethodSchema,
  reference: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export const ReverseExpenseDraftSchema = z.object({
  idempotencyKey: z.string().optional(),
  expenseId: z.string().uuid(),
  reason: z.string().min(3, "A valid reason is required for reversal"),
});
