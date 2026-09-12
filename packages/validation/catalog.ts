import { z } from 'zod';
import { ITEM_TYPES, ITEM_STATUSES, CATEGORY_STATUSES } from '@nnoo/contracts';

// We reuse the exact money validation rule from finance
// where string must represent a non-negative integer (minor units)
const moneyStringMinorSchema = z.string().regex(/^\d+$/, 'Must be a valid integer string (minor units)');

export const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name is too long').trim(),
});

export const updateProductCategorySchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  status: z.enum(CATEGORY_STATUSES).optional(),
});

export const createCatalogItemSchema = z
  .object({
    itemType: z.enum(ITEM_TYPES),
    name: z.string().min(1, 'Item name is required').max(150, 'Name is too long').trim(),
    description: z.string().max(1000, 'Description is too long').trim().nullable().optional(),
    categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
    unitCode: z.string().min(1, 'Unit code is required').trim(),
    sku: z.string().max(50).trim().nullable().optional(),
    barcode: z.string().max(50).trim().nullable().optional(),
    sellingPriceMinor: moneyStringMinorSchema,
    costPriceMinor: moneyStringMinorSchema.nullable().optional(),
    trackInventory: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.itemType === 'service' && data.trackInventory === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['trackInventory'],
        message: 'A service cannot track inventory',
      });
    }
  });

export const updateCatalogItemSchema = z
  .object({
    itemType: z.enum(ITEM_TYPES).optional(),
    name: z.string().min(1).max(150).trim().optional(),
    description: z.string().max(1000).trim().nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    unitCode: z.string().min(1).trim().optional(),
    sku: z.string().max(50).trim().nullable().optional(),
    barcode: z.string().max(50).trim().nullable().optional(),
    sellingPriceMinor: moneyStringMinorSchema.optional(),
    costPriceMinor: moneyStringMinorSchema.nullable().optional(),
    trackInventory: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.itemType === 'service' && data.trackInventory === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['trackInventory'],
        message: 'A service cannot track inventory',
      });
    }
  });

export type CreateCatalogItemDraft = z.infer<typeof createCatalogItemSchema>;
export type UpdateCatalogItemDraft = z.infer<typeof updateCatalogItemSchema>;
export type CreateProductCategoryDraft = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryDraft = z.infer<typeof updateProductCategorySchema>;
export type { CatalogItem, ProductCategory, ItemType, ItemStatus, CategoryStatus } from '@nnoo/contracts';

