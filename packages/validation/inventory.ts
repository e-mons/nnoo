import { z } from 'zod';
import { PAYMENT_METHODS } from '@nnoo/contracts';

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

const numericDeltaSchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,6})?$/, 'Delta must be a number with up to 6 decimal places.')
  .refine((val) => parseFloat(val) !== 0, { message: 'Delta cannot be zero.' });

export const initializeInventorySchema = z.object({
  catalogItemId: z.string().uuid(),
  quantity: numericQuantitySchema,
  unitCostMinor: positiveMinorAmountSchema,
  currencyCode: z.string().min(3).max(3),
  occurredAt: z.string().datetime().optional(),
  idempotencyKey: z.string().min(1),
});

export const createStockReceiptItemSchema = z.object({
  catalogItemId: z.string().uuid(),
  quantity: numericQuantitySchema,
  unitCostMinor: positiveMinorAmountSchema,
});

export const createStockReceiptPaymentSchema = z.object({
  amountMinor: positiveMinorAmountSchema,
  paymentMethod: z.enum(PAYMENT_METHODS),
  reference: z.string().nullable().optional(),
});

export const createStockReceiptSchema = z.object({
  supplierId: z.string().uuid(),
  currencyCode: z.string().min(3).max(3),
  occurredAt: z.string().datetime().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  supplierReference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(createStockReceiptItemSchema).min(1, 'At least one item is required.'),
  payments: z.array(createStockReceiptPaymentSchema).optional(),
  idempotencyKey: z.string().min(1),
});

export const recordStockReceiptPaymentSchema = z.object({
  stockReceiptId: z.string().uuid(),
  amountMinor: positiveMinorAmountSchema,
  paymentMethod: z.enum(PAYMENT_METHODS),
  reference: z.string().nullable().optional(),
  occurredAt: z.string().datetime().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  idempotencyKey: z.string().min(1),
});

export const adjustInventorySchema = z.object({
  catalogItemId: z.string().uuid(),
  quantityDelta: numericDeltaSchema,
  unitCostMinor: positiveMinorAmountSchema.optional(),
  reasonCode: z.string().min(1, 'Reason is required.'),
  notes: z.string().nullable().optional(),
  currencyCode: z.string().min(3).max(3),
  occurredAt: z.string().datetime().optional(),
  idempotencyKey: z.string().min(1),
});
