'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  CreateSaleDraft, 
  RecordSalePaymentDraft, 
  CreateSaleRefundDraft
} from '@nnoo/contracts';
import {
  createSaleSchema, 
  recordSalePaymentSchema, 
  createSaleRefundSchema 
} from '@nnoo/validation';
import { revalidatePath } from 'next/cache';

export async function createSaleAction(businessId: string, draft: CreateSaleDraft) {
  const supabase = await createClient();

  const parseResult = createSaleSchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data
  };

  const { data, error } = await supabase.rpc('create_sale', {
    payload
  });

  if (error) {
    console.error('Error creating sale:', error);
    return { error: error.message };
  }

  revalidatePath(`/${businessId}/sales`);
  return { data };
}

export async function recordSalePaymentAction(businessId: string, draft: RecordSalePaymentDraft) {
  const supabase = await createClient();

  const parseResult = recordSalePaymentSchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data
  };

  const { data, error } = await supabase.rpc('record_sale_payment', {
    payload
  });

  if (error) {
    console.error('Error recording payment:', error);
    return { error: error.message };
  }

  revalidatePath(`/${businessId}/sales`);
  revalidatePath(`/${businessId}/sales/${draft.saleId}`);
  return { data };
}

export async function createSaleRefundAction(businessId: string, draft: CreateSaleRefundDraft) {
  const supabase = await createClient();

  const parseResult = createSaleRefundSchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data
  };

  const { data, error } = await supabase.rpc('create_sale_refund', {
    payload
  });

  if (error) {
    console.error('Error creating refund:', error);
    return { error: error.message };
  }

  revalidatePath(`/${businessId}/sales`);
  revalidatePath(`/${businessId}/sales/${draft.saleId}`);
  return { data };
}

export async function getSalesList(
  businessId: string, 
  options?: { limit?: number; offset?: number; paymentStatus?: string }
) {
  const supabase = await createClient();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);

  let query = supabase
    .from('sales')
    .select(`
      *,
      customers (
        name
      )
    `)
    .eq('business_id', businessId);

  if (options?.paymentStatus) {
    query = query.eq('payment_status', options.paymentStatus as any);
  }

  const { data, error } = await query
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching sales list:', error);
    return [];
  }
  return data;
}

export async function getSaleDetails(businessId: string, saleId: string) {
  const supabase = await createClient();
  const [saleResult, itemsResult, paymentsResult, refundsResult] = await Promise.all([
    supabase
      .from('sales')
      .select('*, customers(name, email), invoices(id, document_status)')
      .eq('id', saleId)
      .eq('business_id', businessId)
      .single(),
    supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId)
      .order('line_order', { ascending: true }),
    supabase
      .from('sale_payments')
      .select('*')
      .eq('sale_id', saleId)
      .order('occurred_at', { ascending: true }),
    supabase
      .from('sale_refunds')
      .select('*, sale_refund_items(*)')
      .eq('sale_id', saleId)
      .order('occurred_at', { ascending: true })
  ]);

  return {
    sale: saleResult.data,
    items: itemsResult.data || [],
    payments: paymentsResult.data || [],
    refunds: refundsResult.data || []
  };
}
