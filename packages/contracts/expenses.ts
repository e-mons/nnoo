export type ExpenseCategory = {
  id: string;
  businessId: string;
  name: string;
  systemKey: string | null;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
};

import { PaymentStatus, PaymentMethod } from './sales';

export type ExpenseStatus = 'posted' | 'reversed';

export type Expense = {
  id: string;
  businessId: string;
  expenseNumber: string;
  categoryId: string;
  supplierId: string | null;
  currencyCode: string;
  totalMinor: string;
  occurredAt: string;
  effectiveDate: string;
  dueDate: string | null;
  description: string;
  externalReference: string | null;
  notes: string | null;
  receiptPath: string | null;
  paymentStatus: PaymentStatus;
  status: ExpenseStatus;
  createdByUserId: string | null;
  reversedByUserId: string | null;
  reversalReason: string | null;
  reversedAt: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpensePayment = {
  id: string;
  businessId: string;
  expenseId: string;
  amountMinor: string;
  currencyCode: string;
  paymentMethod: PaymentMethod;
  externalReference: string | null;
  occurredAt: string;
  effectiveDate: string;
  paidByUserId: string | null;
  idempotencyKey: string;
  createdAt: string;
};

export type CreateExpensePaymentPayload = {
  amountMinor: string;
  paymentMethod: PaymentMethod;
  reference?: string;
};

export type CreateExpensePayload = {
  businessId: string;
  categoryId: string;
  supplierId?: string;
  currencyCode: string;
  totalMinor: string;
  occurredAt?: string;
  effectiveDate: string;
  dueDate?: string;
  description: string;
  externalReference?: string;
  notes?: string;
  receiptPath?: string;
  payments?: CreateExpensePaymentPayload[];
  idempotencyKey: string;
};

export type RecordExpensePaymentPayload = {
  businessId: string;
  expenseId: string;
  amountMinor: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  occurredAt?: string;
  effectiveDate: string;
  idempotencyKey: string;
};

export type ReverseExpensePayload = {
  businessId: string;
  expenseId: string;
  reason: string;
  idempotencyKey: string;
};
