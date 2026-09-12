'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  CreateExpensePayload,
  RecordExpensePaymentPayload,
  ReverseExpensePayload
} from '@nnoo/contracts';
import {
  CreateExpenseDraftSchema,
  RecordExpensePaymentDraftSchema,
  ReverseExpenseDraftSchema
} from '@nnoo/validation';
import { revalidatePath } from 'next/cache';

export async function createExpenseAction(businessId: string, draft: any) {
  const supabase = await createClient();

  const parseResult = CreateExpenseDraftSchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data
  };

  const { data, error } = await supabase.rpc('create_expense', {
    payload
  });

  if (error) {
    console.error('Error creating expense:', error);
    return { error: error.message };
  }

  revalidatePath(`/(app)/[businessSlug]/expenses`, 'page');
  return { data };
}

export async function recordExpensePaymentAction(businessId: string, draft: any) {
  const supabase = await createClient();

  const parseResult = RecordExpensePaymentDraftSchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data
  };

  const { data, error } = await supabase.rpc('record_expense_payment', {
    payload
  });

  if (error) {
    console.error('Error recording expense payment:', error);
    return { error: error.message };
  }

  revalidatePath(`/(app)/[businessSlug]/expenses`, 'page');
  revalidatePath(`/(app)/[businessSlug]/expenses/[expenseId]`, 'page');
  return { data };
}

export async function reverseExpenseAction(businessId: string, draft: any) {
  const supabase = await createClient();

  const parseResult = ReverseExpenseDraftSchema.safeParse(draft);
  if (!parseResult.success) {
    return { error: 'Validation failed', details: parseResult.error.flatten() };
  }

  const payload = {
    businessId,
    ...parseResult.data
  };

  const { data, error } = await supabase.rpc('reverse_expense', {
    payload
  });

  if (error) {
    console.error('Error reversing expense:', error);
    return { error: error.message };
  }

  revalidatePath(`/(app)/[businessSlug]/expenses`, 'page');
  revalidatePath(`/(app)/[businessSlug]/expenses/[expenseId]`, 'page');
  return { data };
}

export async function getExpenseCategories(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching expense categories:', error);
    return [];
  }
  return data;
}

export async function getExpensesList(
  businessId: string,
  options?: { limit?: number; offset?: number; categoryId?: string; status?: string }
) {
  const supabase = await createClient();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);

  let query = supabase
    .from('expenses')
    .select(`
      *,
      expense_categories (name),
      suppliers (name)
    `)
    .eq('business_id', businessId);

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }
  if (options?.status) {
    query = query.eq('status', options.status as any);
  }

  const { data, error } = await query
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching expenses list:', error);
    return [];
  }
  return data;
}

export async function getExpenseDetails(businessId: string, expenseId: string) {
  const supabase = await createClient();
  const [expenseResult, paymentsResult] = await Promise.all([
    supabase
      .from('expenses')
      .select('*, expense_categories(name), suppliers(name)')
      .eq('id', expenseId)
      .eq('business_id', businessId)
      .single(),
    supabase
      .from('expense_payments')
      .select('*')
      .eq('expense_id', expenseId)
      .order('occurred_at', { ascending: true })
  ]);

  return {
    expense: expenseResult.data,
    payments: paymentsResult.data || []
  };
}

export async function uploadExpenseReceipt(businessId: string, expenseId: string, file: File) {
  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const filePath = `businesses/${businessId}/expenses/${expenseId}/receipt_${Date.now()}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from('expense-receipts')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error('Error uploading receipt:', error);
    return { error: error.message };
  }
  
  return { filePath };
}

export async function getExpenseReceiptSignedUrl(filePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from('expense-receipts')
    .createSignedUrl(filePath, 60 * 60); // 1 hour expiration

  if (error) {
    console.error('Error creating signed url:', error);
    return { error: error.message };
  }
  
  return { signedUrl: data.signedUrl };
}
