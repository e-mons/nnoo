'use server';

import { createClient } from '@/lib/supabase/server';
import {
  initializeInventorySchema,
  createStockReceiptSchema,
  recordStockReceiptPaymentSchema,
  adjustInventorySchema,
} from '@nnoo/validation';
import { revalidatePath } from 'next/cache';

export async function getInventoryPositions(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory_positions')
    .select(`
      *,
      catalog_items (name, sku, unit_code, selling_price_minor, cost_price_minor, currency_code)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory positions:', error);
    return [];
  }
  return data;
}

export async function getInventoryMovements(businessId: string, catalogItemId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('inventory_movements')
    .select('*')
    .eq('business_id', businessId)
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (catalogItemId) {
    query = query.eq('catalog_item_id', catalogItemId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching inventory movements:', error);
    return [];
  }
  return data;
}

export async function initializeInventoryAction(businessId: string, draft: any) {
  const supabase = await createClient();

  const parseResult = initializeInventorySchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data,
  };

  const { data, error } = await supabase.rpc('initialize_inventory', { payload });

  if (error) {
    console.error('Error initializing inventory:', error);
    return { error: error.message };
  }

  revalidatePath(`/(app)/[businessSlug]/inventory`, 'page');
  revalidatePath(`/(app)/[businessSlug]/products`, 'page');
  return { data };
}

export async function createStockReceiptAction(businessId: string, draft: any) {
  const supabase = await createClient();

  const parseResult = createStockReceiptSchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data,
  };

  const { data, error } = await supabase.rpc('create_stock_receipt', { payload });

  if (error) {
    console.error('Error creating stock receipt:', error);
    return { error: error.message };
  }

  revalidatePath(`/(app)/[businessSlug]/inventory`, 'page');
  revalidatePath(`/(app)/[businessSlug]/inventory/receipts`, 'page');
  return { data };
}

export async function recordStockReceiptPaymentAction(businessId: string, draft: any) {
  const supabase = await createClient();

  const parseResult = recordStockReceiptPaymentSchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data,
  };

  const { data, error } = await supabase.rpc('record_stock_receipt_payment', { payload });

  if (error) {
    console.error('Error recording stock receipt payment:', error);
    return { error: error.message };
  }

  revalidatePath(`/(app)/[businessSlug]/inventory/receipts`, 'page');
  return { data };
}

export async function adjustInventoryAction(businessId: string, draft: any) {
  const supabase = await createClient();

  const parseResult = adjustInventorySchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data,
  };

  const { data, error } = await supabase.rpc('adjust_inventory', { payload });

  if (error) {
    console.error('Error adjusting inventory:', error);
    return { error: error.message };
  }

  revalidatePath(`/(app)/[businessSlug]/inventory`, 'page');
  return { data };
}

export async function getStockReceiptsList(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stock_receipts')
    .select(`
      *,
      suppliers (name)
    `)
    .eq('business_id', businessId)
    .order('occurred_at', { ascending: false });

  if (error) {
    console.error('Error fetching stock receipts:', error);
    return [];
  }
  return data;
}

export async function getStockReceiptDetails(businessId: string, receiptId: string) {
  const supabase = await createClient();
  const [receiptResult, itemsResult, paymentsResult] = await Promise.all([
    supabase
      .from('stock_receipts')
      .select('*, suppliers(name)')
      .eq('id', receiptId)
      .eq('business_id', businessId)
      .single(),
    supabase
      .from('stock_receipt_items')
      .select('*')
      .eq('stock_receipt_id', receiptId)
      .order('line_order', { ascending: true }),
    supabase
      .from('stock_receipt_payments')
      .select('*')
      .eq('stock_receipt_id', receiptId)
      .order('occurred_at', { ascending: true }),
  ]);

  return {
    receipt: receiptResult.data,
    items: itemsResult.data || [],
    payments: paymentsResult.data || [],
  };
}
