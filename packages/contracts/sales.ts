export const PAYMENT_STATUSES = ['unpaid', 'partially_paid', 'paid'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const REFUND_STATUSES = ['none', 'partially_refunded', 'refunded'] as const;
export type RefundStatus = typeof REFUND_STATUSES[number];

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'pos', 'other'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const REFUND_REASONS = ['customer_return', 'wrong_item', 'damaged', 'correction', 'other'] as const;
export type RefundReason = typeof REFUND_REASONS[number];

export interface Sale {
  id: string;
  businessId: string;
  saleNumber: string;
  customerId: string | null;
  currencyCode: string;
  subtotalMinor: string;
  discountTotalMinor: string;
  totalMinor: string;
  occurredAt: string;
  effectiveDate: string;
  notes: string | null;
  paymentStatus: PaymentStatus;
  refundStatus: RefundStatus;
  createdByUserId: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  businessId: string;
  saleId: string;
  catalogItemId: string | null;
  itemTypeSnapshot: string;
  itemNameSnapshot: string;
  skuSnapshot: string | null;
  unitCodeSnapshot: string;
  trackInventorySnapshot: boolean;
  quantity: string;
  unitPriceMinor: string;
  discountMinor: string;
  lineTotalMinor: string;
  lineOrder: number;
  createdAt: string;
}

export interface SalePayment {
  id: string;
  businessId: string;
  saleId: string;
  amountMinor: string;
  currencyCode: string;
  paymentMethod: PaymentMethod;
  reference: string | null;
  occurredAt: string;
  effectiveDate: string;
  receivedByUserId: string | null;
  idempotencyKey: string;
  createdAt: string;
}

export interface SaleRefund {
  id: string;
  businessId: string;
  saleId: string;
  refundNumber: string;
  totalMinor: string;
  receivableReductionMinor: string;
  cashRefundMinor: string;
  cashRefundMethod: PaymentMethod | null;
  cashRefundReference: string | null;
  reason: RefundReason;
  notes: string | null;
  occurredAt: string;
  effectiveDate: string;
  createdByUserId: string | null;
  idempotencyKey: string;
  createdAt: string;
}

export interface SaleRefundItem {
  id: string;
  businessId: string;
  refundId: string;
  saleItemId: string;
  quantity: string;
  refundAmountMinor: string;
  restocked: boolean;
  cogsReversalMinor: string;
  createdAt: string;
}

export interface CreateSaleItemDraft {
  catalogItemId: string;
  quantity: string; // numeric 14,6 string
  discountMinor: string;
}

export interface CreateSalePaymentDraft {
  amountMinor: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

export interface CreateSaleDraft {
  customerId?: string | null;
  currencyCode: string;
  occurredAt?: string;
  effectiveDate: string;
  notes?: string | null;
  items: CreateSaleItemDraft[];
  payments?: CreateSalePaymentDraft[];
  idempotencyKey: string;
}

export interface RecordSalePaymentDraft {
  saleId: string;
  amountMinor: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  occurredAt?: string;
  effectiveDate: string;
  idempotencyKey: string;
}

export interface CreateSaleRefundItemDraft {
  saleItemId: string;
  quantity: string; // numeric 14,6 string
  restock?: boolean;
}

export interface CreateSaleRefundDraft {
  saleId: string;
  reason: RefundReason;
  notes?: string | null;
  occurredAt?: string;
  effectiveDate: string;
  items: CreateSaleRefundItemDraft[];
  cashRefundMethod?: PaymentMethod | null;
  cashRefundReference?: string | null;
  idempotencyKey: string;
}
