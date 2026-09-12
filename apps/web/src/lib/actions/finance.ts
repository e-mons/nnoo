'use server';

import { createClient } from '@/lib/supabase/server';
import {
  FinancialPostingDraft,
  financialPostingDraftSchema,
  FinancialPostingResult,
} from '@nnoo/validation';

/**
 * Server-only service for posting canonical financial entries.
 * Validates the draft against schema constraints and delegates 
 * atomicity and idempotency to the trusted Supabase RPC `post_financial_entry`.
 */
export async function postFinancialEntry(
  draft: FinancialPostingDraft
): Promise<{ success: boolean; data?: FinancialPostingResult; error?: string }> {
  try {
    // 1. Zod Validation (ensures balancing, >=0 amounts, line format)
    const validDraft = financialPostingDraftSchema.parse(draft);

    const supabase = await createClient();
    
    // 2. We depend on RLS and the RPC internal verification.
    // However, the RPC requires the current user context.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized: User not found.' };
    }

    // Embed current user as creator if not specified
    const payload = {
      ...validDraft,
      createdByUserId: validDraft.createdByUserId || user.id,
    };

    // 3. Call the security definer RPC
    const { data, error: rpcError } = await supabase.rpc('post_financial_entry', {
      payload,
    });

    if (rpcError) {
      console.error('Financial Posting Error:', rpcError);
      return { success: false, error: rpcError.message };
    }

    // 4. In a fuller implementation, we might query the resulting entry/lines to return them.
    // For now, the RPC returns the ID.
    return { 
      success: true, 
      data: data as unknown as FinancialPostingResult 
    };

  } catch (error: unknown) {
    console.error('Financial Posting Validation Error:', error);
    const err = error as Error;
    return {
      success: false,
      error: err.message || 'An error occurred during financial posting.',
    };
  }
}

export async function reverseFinancialEntry(
  originalEntryId: string,
  idempotencyKey: string,
  reason: string
): Promise<{ success: boolean; entryId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized: User not found.' };
    }

    const { data, error: rpcError } = await supabase.rpc('reverse_financial_entry', {
      p_original_entry_id: originalEntryId,
      p_idempotency_key: idempotencyKey,
      p_reason: reason,
      p_created_by_user_id: user.id,
    });

    if (rpcError) {
      console.error('Financial Reversal Error:', rpcError);
      return { success: false, error: rpcError.message };
    }

    return { success: true, entryId: (data as { id: string })?.id };
  } catch (error: unknown) {
    console.error('Financial Reversal Error:', error);
    const err = error as Error;
    return {
      success: false,
      error: err.message || 'An error occurred during reversal.',
    };
  }
}
