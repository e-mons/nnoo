export const ITEM_TYPES = ['product', 'service'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_STATUSES = ['active', 'inactive', 'archived'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const CATEGORY_STATUSES = ['active', 'archived'] as const;
export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];

export interface ProductCategory {
  id: string;
  businessId: string;
  name: string;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  businessId: string;
  itemType: ItemType;
  name: string;
  description: string | null;
  categoryId: string | null;
  unitCode: string;
  sku: string | null;
  barcode: string | null;
  sellingPriceMinor: string; // BIGINT string
  costPriceMinor?: string | null; // Optional based on role
  currencyCode: string;
  trackInventory: boolean;
  status: ItemStatus;
  imagePath: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogItemDraft {
  itemType: ItemType;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  unitCode: string;
  sku?: string | null;
  barcode?: string | null;
  sellingPriceMinor: string;
  costPriceMinor?: string | null;
  trackInventory: boolean;
}

export interface UpdateCatalogItemDraft {
  itemType?: ItemType;
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  unitCode?: string;
  sku?: string | null;
  barcode?: string | null;
  sellingPriceMinor?: string;
  costPriceMinor?: string | null;
  trackInventory?: boolean;
}

export interface CreateProductCategoryDraft {
  name: string;
}

export interface UpdateProductCategoryDraft {
  name?: string;
  status?: CategoryStatus;
}
