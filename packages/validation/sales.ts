import { z } from 'zod';
import { PAYMENT_METHODS, REFUND_REASONS } from '@nnoo/contracts';

// Common rules
const numericQuantitySchema = z
  .string()
  .regex(/^\d+(\.\d{1,6})?$/, 'Quantity must be a positive number with up to 6 decimal places.')
  .refine((val) => parseFloat(val) > 0, { message: 'Quantity must be greater than zero.' });

const minorAmountSchema = z
  .string()
  .regex(/^\d+$/, 'Amount must be an integer minor amount.')
  .refine((val) => parseInt(val, 10) >= 0, { message: 'Amount cannot be negative.' });

const positiveMinorAmountSchema = minorAmountSchema.refine((val) => parseInt(val, 10) > 0, {
  message: 'Amount must be greater than zero.',
});

export const createSaleItemSchema = z.object({
  catalogItemId: z.string().uuid(),
  quantity: numericQuantitySchema,
  discountMinor: minorAmountSchema.default('0'),
});

export const createSalePaymentSchema = z.object({
  amountMinor: positiveMinorAmountSchema,
  paymentMethod: z.enum(PAYMENT_METHODS),
  reference: z.string().nullable().optional(),
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid().nullable().optional(),
  currencyCode: z.string().min(3).max(3),
  occurredAt: z.string().datetime().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  notes: z.string().nullable().optional(),
  items: z.array(createSaleItemSchema).min(1, 'At least one item is required.'),
  payments: z.array(createSalePaymentSchema).optional(),
  idempotencyKey: z.string().min(1),
});

export const recordSalePaymentSchema = z.object({
  saleId: z.string().uuid(),
  amountMinor: positiveMinorAmountSchema,
  paymentMethod: z.enum(PAYMENT_METHODS),
  reference: z.string().nullable().optional(),
  occurredAt: z.string().datetime().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  idempotencyKey: z.string().min(1),
});

export const createSaleRefundItemSchema = z.object({
  saleItemId: z.string().uuid(),
  quantity: numericQuantitySchema,
  restock: z.boolean().optional().default(false),
});

export const createSaleRefundSchema = z.object({
  saleId: z.string().uuid(),
  reason: z.enum(REFUND_REASONS),
  notes: z.string().nullable().optional(),
  occurredAt: z.string().datetime().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  items: z.array(createSaleRefundItemSchema).min(1, 'At least one item is required for a refund.'),
  cashRefundMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
  cashRefundReference: z.string().nullable().optional(),
  idempotencyKey: z.string().min(1),
});
