import { PaymentStatus, PaymentMethod } from './sales';

// --- Enums / Constants ---
export const INVENTORY_POSITION_STATUSES = ['pending_initialization', 'initialized'] as const;
export type InventoryPositionStatus = typeof INVENTORY_POSITION_STATUSES[number];

export const INVENTORY_MOVEMENT_TYPES = [
  'opening_stock',
  'purchase_receipt',
  'sale_issue',
  'sale_refund_return',
  'adjustment_increase',
  'adjustment_decrease',
] as const;
export type InventoryMovementType = typeof INVENTORY_MOVEMENT_TYPES[number];

export const STOCK_RECEIPT_STATUSES = ['posted', 'reversed'] as const;
export type StockReceiptStatus = typeof STOCK_RECEIPT_STATUSES[number];

// --- Domain Models ---

export interface InventoryPosition {
  id: string;
  businessId: string;
  catalogItemId: string;
  status: InventoryPositionStatus;
  initializedAt: string | null;
  quantityOnHand: string; // numeric(14,6) represented as string
  inventoryValueMinor: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  businessId: string;
  catalogItemId: string;
  movementType: InventoryMovementType;
  quantityDelta: string;
  inventoryValueDeltaMinor: string;
  unitCodeSnapshot: string | null;
  sourceEventType: string;
  sourceEventId: string;
  sourceLineId: string | null;
  occurredAt: string;
  createdByUserId: string | null;
  idempotencyKey: string;
  createdAt: string;
}

export interface StockReceipt {
  id: string;
  businessId: string;
  receiptNumber: string;
  supplierId: string;
  currencyCode: string;
  totalMinor: string;
  paymentStatus: PaymentStatus;
  status: StockReceiptStatus;
  occurredAt: string;
  effectiveDate: string;
  supplierReference: string | null;
  notes: string | null;
  createdByUserId: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockReceiptItem {
  id: string;
  businessId: string;
  stockReceiptId: string;
  catalogItemId: string;
  itemNameSnapshot: string;
  unitCodeSnapshot: string | null;
  quantity: string;
  unitCostMinor: string;
  lineTotalMinor: string;
  lineOrder: number;
  createdAt: string;
}

export interface StockReceiptPayment {
  id: string;
  businessId: string;
  stockReceiptId: string;
  amountMinor: string;
  currencyCode: string;
  paymentMethod: PaymentMethod;
  reference: string | null;
  occurredAt: string;
  effectiveDate: string;
  paidByUserId: string | null;
  idempotencyKey: string;
  createdAt: string;
}

// --- Draft Types ---

export interface InitializeInventoryDraft {
  catalogItemId: string;
  quantity: string;
  unitCostMinor: string;
  currencyCode: string;
  occurredAt?: string;
  idempotencyKey: string;
}

export interface CreateStockReceiptItemDraft {
  catalogItemId: string;
  quantity: string;
  unitCostMinor: string;
}

export interface CreateStockReceiptPaymentDraft {
  amountMinor: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

export interface CreateStockReceiptDraft {
  supplierId: string;
  currencyCode: string;
  occurredAt?: string;
  effectiveDate: string;
  supplierReference?: string | null;
  notes?: string | null;
  items: CreateStockReceiptItemDraft[];
  payments?: CreateStockReceiptPaymentDraft[];
  idempotencyKey: string;
}

export interface RecordStockReceiptPaymentDraft {
  stockReceiptId: string;
  amountMinor: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  occurredAt?: string;
  effectiveDate: string;
  idempotencyKey: string;
}

export interface AdjustInventoryDraft {
  catalogItemId: string;
  quantityDelta: string;
  unitCostMinor?: string;
  reasonCode: string;
  notes?: string | null;
  currencyCode: string;
  occurredAt?: string;
  idempotencyKey: string;
}
