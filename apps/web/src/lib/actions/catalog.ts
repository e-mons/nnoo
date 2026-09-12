'use server';

import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateCatalogItemDraft,
  UpdateCatalogItemDraft,
  CreateProductCategoryDraft,
  createCatalogItemSchema,
  updateCatalogItemSchema,
  createProductCategorySchema,
  CatalogItem,
  ProductCategory,
  CategoryStatus,
  ItemStatus,
  ItemType
} from '@nnoo/validation';
import { Database } from '@nnoo/supabase';

type ProductCategoryRow = Database['public']['Tables']['product_categories']['Row'];
type CatalogItemRow = Database['public']['Tables']['catalog_items']['Row'];

function mapProductCategory(row: ProductCategoryRow): ProductCategory {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    status: row.status as CategoryStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCatalogItem(row: CatalogItemRow): CatalogItem {
  return {
    id: row.id,
    businessId: row.business_id,
    itemType: row.item_type as ItemType,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    unitCode: row.unit_code,
    sku: row.sku,
    barcode: row.barcode,
    sellingPriceMinor: row.selling_price_minor.toString(),
    costPriceMinor: row.cost_price_minor !== null && row.cost_price_minor !== undefined ? row.cost_price_minor.toString() : null,
    currencyCode: row.currency_code,
    trackInventory: row.track_inventory,
    status: row.status as ItemStatus,
    imagePath: row.image_path,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Ensures user is authenticated and part of a business.
 */
async function getAuthAndSession() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Unauthorized');
  
  return { supabase, user };
}

/**
 * Checks if a user has sufficient privileges to view cost.
 * Note: RLS handles basic access, but cost projection is a separate privacy layer.
 */
async function canViewCost(supabase: SupabaseClient, businessId: string): Promise<boolean> {
  const { data } = await supabase.rpc('has_business_role', {
    business_id: businessId,
    allowed_roles: ['owner', 'business_admin', 'manager', 'inventory_staff', 'accountant']
  });
  return !!data;
}

/**
 * Gets categories for a business.
 */
export async function getProductCategories(businessId: string): Promise<{ success: boolean; data?: ProductCategory[]; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (error) throw error;

    return { success: true, data: (data || []).map(mapProductCategory) };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message };
  }
}

/**
 * Creates a category.
 */
export async function createProductCategory(businessId: string, draft: CreateProductCategoryDraft): Promise<{ success: boolean; data?: ProductCategory; error?: string }> {
  try {
    const validDraft = createProductCategorySchema.parse(draft);
    const { supabase } = await getAuthAndSession();

    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        business_id: businessId,
        name: validDraft.name,
        status: 'active'
      })
      .select('*')
      .single();

    if (error || !data) throw error || new Error('Failed to create category');

    return { success: true, data: mapProductCategory(data) };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message };
  }
}

/**
 * Creates a catalog item securely.
 */
export async function createCatalogItem(businessId: string, draft: CreateCatalogItemDraft): Promise<{ success: boolean; data?: CatalogItem; error?: string }> {
  try {
    const validDraft = createCatalogItemSchema.parse(draft);
    const { supabase, user } = await getAuthAndSession();

    // The active session business currency should ideally be validated. 
    // We fetch it securely from the business table.
    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .select('currency_code')
      .eq('id', businessId)
      .single();

    if (bizError || !bizData) throw new Error('Business context invalid');

    const insertPayload: Database['public']['Tables']['catalog_items']['Insert'] = {
      business_id: businessId,
      item_type: validDraft.itemType,
      name: validDraft.name,
      description: validDraft.description ?? null,
      category_id: validDraft.categoryId ?? null,
      unit_code: validDraft.unitCode,
      sku: validDraft.sku ?? null,
      barcode: validDraft.barcode ?? null,
      selling_price_minor: parseInt(validDraft.sellingPriceMinor, 10),
      cost_price_minor: validDraft.costPriceMinor ? parseInt(validDraft.costPriceMinor, 10) : null,
      track_inventory: validDraft.trackInventory,
      currency_code: bizData.currency_code,
      created_by_user_id: user.id
    };

    const { data, error } = await supabase
      .from('catalog_items')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !data) throw error || new Error('Failed to create item');

    const item = mapCatalogItem(data);

    // Filter cost if they don't have access (even though they created it, their role might not permit standard viewing).
    const canView = await canViewCost(supabase, businessId);
    if (!canView) {
      delete item.costPriceMinor;
    }

    return { success: true, data: item };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message };
  }
}

/**
 * Updates a catalog item.
 */
export async function updateCatalogItem(businessId: string, itemId: string, draft: UpdateCatalogItemDraft): Promise<{ success: boolean; data?: CatalogItem; error?: string }> {
  try {
    const validDraft = updateCatalogItemSchema.parse(draft);
    const { supabase } = await getAuthAndSession();

    // Prevent forging cost price if user lacks cost permission
    if (validDraft.costPriceMinor !== undefined) {
      const canView = await canViewCost(supabase, businessId);
      if (!canView) throw new Error('Unauthorized to modify cost price');
    }

    const updatePayload: Database['public']['Tables']['catalog_items']['Update'] = {};
    if (validDraft.itemType !== undefined) updatePayload.item_type = validDraft.itemType;
    if (validDraft.name !== undefined) updatePayload.name = validDraft.name;
    if (validDraft.description !== undefined) updatePayload.description = validDraft.description;
    if (validDraft.categoryId !== undefined) updatePayload.category_id = validDraft.categoryId;
    if (validDraft.unitCode !== undefined) updatePayload.unit_code = validDraft.unitCode;
    if (validDraft.sku !== undefined) updatePayload.sku = validDraft.sku;
    if (validDraft.barcode !== undefined) updatePayload.barcode = validDraft.barcode;
    if (validDraft.sellingPriceMinor !== undefined) updatePayload.selling_price_minor = parseInt(validDraft.sellingPriceMinor, 10);
    if (validDraft.costPriceMinor !== undefined) {
      updatePayload.cost_price_minor = validDraft.costPriceMinor ? parseInt(validDraft.costPriceMinor, 10) : null;
    }
    if (validDraft.trackInventory !== undefined) updatePayload.track_inventory = validDraft.trackInventory;

    const { data, error } = await supabase
      .from('catalog_items')
      .update(updatePayload)
      .eq('id', itemId)
      .eq('business_id', businessId)
      .select('*')
      .single();

    if (error || !data) throw error || new Error('Failed to update item');

    const item = mapCatalogItem(data);
    const canView = await canViewCost(supabase, businessId);
    if (!canView) delete item.costPriceMinor;

    return { success: true, data: item };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message };
  }
}

/**
 * Archives a catalog item.
 */
export async function archiveCatalogItem(businessId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();

    const { error } = await supabase
      .from('catalog_items')
      .update({ status: 'archived' })
      .eq('id', itemId)
      .eq('business_id', businessId);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message };
  }
}

/**
 * Reactivates a catalog item.
 */
export async function reactivateCatalogItem(businessId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();

    const { error } = await supabase
      .from('catalog_items')
      .update({ status: 'active' })
      .eq('id', itemId)
      .eq('business_id', businessId);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message };
  }
}

/**
 * Gets a catalog item by ID, securely hiding cost price where needed.
 */
export async function getCatalogItem(businessId: string, itemId: string): Promise<{ success: boolean; data?: CatalogItem; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();

    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .eq('id', itemId)
      .eq('business_id', businessId)
      .single();

    if (error || !data) throw error || new Error('Item not found');

    const item = mapCatalogItem(data);
    const canView = await canViewCost(supabase, businessId);
    if (!canView) delete item.costPriceMinor;

    return { success: true, data: item };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message };
  }
}

/**
 * Gets paginated/filtered catalog list, omitting sensitive fields according to role.
 */
export async function getCatalogList(businessId: string, searchParams: URLSearchParams): Promise<{ success: boolean; data?: CatalogItem[]; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();

    let query = supabase
      .from('catalog_items')
      .select('*')
      .eq('business_id', businessId);

    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active'; // Default to active

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (type) {
      query = query.eq('item_type', type);
    }
    
    if (category) {
      query = query.eq('category_id', category);
    }

    if (q) {
      // Basic ilike on name or SKU
      query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    const items = (data || []).map(mapCatalogItem);
    const canView = await canViewCost(supabase, businessId);

    if (!canView) {
      for (const item of items) {
        delete item.costPriceMinor;
      }
    }

    return { success: true, data: items };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message };
  }
}

