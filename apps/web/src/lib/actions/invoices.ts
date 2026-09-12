'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  SaveInvoiceDraftInput, 
  IssueInvoiceInput, 
  VoidInvoiceInput, 
  saveInvoiceDraftSchema, 
  issueInvoiceSchema, 
  voidInvoiceSchema 
} from '@nnoo/validation';

export async function saveInvoiceDraft(input: SaveInvoiceDraftInput) {
  const parsed = saveInvoiceDraftSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('save_invoice_draft', {
    payload: parsed as any
  });

  if (error) {
    throw new Error(`Failed to save invoice draft: ${error.message}`);
  }

  return data;
}

export async function issueInvoice(input: IssueInvoiceInput) {
  const parsed = issueInvoiceSchema.parse(input);
  const supabase = await createClient();

  const payloadForDb = {
    ...parsed,
    businessId: parsed.business_id,
    customerId: parsed.customer_id,
    currencyCode: parsed.currency_code,
    effectiveDate: parsed.effective_date,
    idempotencyKey: parsed.idempotency_key,
    items: parsed.items.map(item => ({
      ...item,
      catalogItemId: item.catalog_item_id,
      discountMinor: item.discount_minor,
      quantity: item.quantity
    }))
  };

  const { data, error } = await supabase.rpc('issue_invoice', {
    payload: payloadForDb as any
  });

  if (error) {
    throw new Error(`Failed to issue invoice: ${error.message}`);
  }

  return data;
}

export async function generateInvoiceFromSale(saleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('generate_invoice_from_sale', {
    p_sale_id: saleId
  });

  if (error) {
    throw new Error(`Failed to generate invoice from sale: ${error.message}`);
  }

  return data;
}

export async function voidInvoice(input: VoidInvoiceInput) {
  const parsed = voidInvoiceSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase.rpc('void_invoice', {
    p_invoice_id: parsed.invoice_id,
    p_reason: parsed.reason
  });

  if (error) {
    throw new Error(`Failed to void invoice: ${error.message}`);
  }
}

export async function getInvoicesList(
  businessId: string,
  options?: { limit?: number; offset?: number; documentStatus?: string }
) {
  const supabase = await createClient();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);

  let query = supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      document_status,
      total_minor,
      currency_code,
      issue_date,
      due_date,
      customers (
        name
      )
    `)
    .eq('business_id', businessId);

  if (options?.documentStatus) {
    query = query.eq('document_status', options.documentStatus as any);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching invoices list:', error);
    return [];
  }
  return data;
}
