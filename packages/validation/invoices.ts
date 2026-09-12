import { z } from 'zod';
const numericQuantitySchema = z.number().positive();
const minorAmountSchema = z.number().int().min(0);
const currencyCodeSchema = z.string().min(3).max(3);

export const invoiceLineSchema = z.object({
  catalog_item_id: z.string().uuid().optional().nullable(),
  item_type_snapshot: z.string(),
  item_name_snapshot: z.string(),
  sku_snapshot: z.string().optional().nullable(),
  unit_code_snapshot: z.string(),
  track_inventory_snapshot: z.boolean(),
  quantity: numericQuantitySchema,
  unit_price_minor: minorAmountSchema,
  discount_minor: minorAmountSchema.optional().default(0),
  line_total_minor: minorAmountSchema,
  line_order: z.number().int().min(0)
});

export const saveInvoiceDraftSchema = z.object({
  id: z.string().uuid().optional(), // If updating an existing draft
  business_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  currency_code: currencyCodeSchema,
  subtotal_minor: minorAmountSchema,
  discount_total_minor: minorAmountSchema.optional().default(0),
  total_minor: minorAmountSchema,
  due_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceLineSchema).min(1, "At least one item is required")
});

export const issueInvoiceSchema = z.object({
  invoice_id: z.string().uuid(),
  business_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  currency_code: currencyCodeSchema,
  subtotal_minor: minorAmountSchema,
  discount_total_minor: minorAmountSchema.optional().default(0),
  total_minor: minorAmountSchema,
  effective_date: z.string(),
  due_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  idempotency_key: z.string().min(1),
  items: z.array(invoiceLineSchema).min(1, "At least one item is required"),
  // Issue Invoice also accepts initial payment if any
  payments: z.array(z.object({
    amount_minor: minorAmountSchema,
    payment_method: z.enum(['cash', 'bank_transfer', 'pos', 'other']),
    reference: z.string().optional().nullable()
  })).optional()
});

export const voidInvoiceSchema = z.object({
  invoice_id: z.string().uuid(),
  reason: z.string().min(1, "Void reason is required")
});

export type SaveInvoiceDraftInput = z.infer<typeof saveInvoiceDraftSchema>;
export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;
export type VoidInvoiceInput = z.infer<typeof voidInvoiceSchema>;
