'use server';

import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateCustomerDraft,
  UpdateCustomerDraft,
  Customer,
  CustomerStatus,
  CustomerType,
  CustomerDuplicateCandidate
} from '@nnoo/contracts';
import {
  createCustomerSchema,
  updateCustomerSchema
} from '@nnoo/validation';
import { Database } from '@nnoo/supabase';

type CustomerRow = Database['public']['Tables']['customers']['Row'];

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    businessId: row.business_id,
    customerType: row.customer_type as CustomerType,
    name: row.name,
    companyName: row.company_name,
    phone: row.phone,
    email: row.email,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    state: row.state,
    countryCode: row.country_code,
    notes: row.notes,
    status: row.status as CustomerStatus,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

async function getAuthAndSession() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Unauthorized');
  
  return { supabase, user };
}

export async function createCustomer(businessId: string, draft: CreateCustomerDraft): Promise<{ success: boolean; data?: Customer; duplicateCandidates?: CustomerDuplicateCandidate[]; error?: string }> {
  try {
    const { supabase, user } = await getAuthAndSession();
    
    // Validate input
    const parsed = createCustomerSchema.safeParse(draft);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const validData = parsed.data;

    // Check for potential duplicates (advisory only)
    const orClauses = [];
    if (validData.name) orClauses.push(`name.ilike.%${validData.name}%`);
    if (validData.phone) orClauses.push(`phone.eq.${validData.phone}`);
    if (validData.email) orClauses.push(`email.ilike.${validData.email}`);

    let duplicateCandidates: CustomerDuplicateCandidate[] = [];
    
    if (orClauses.length > 0) {
      const { data: potentialDuplicates, error: dupError } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('business_id', businessId)
        .or(orClauses.join(','));

      if (!dupError && potentialDuplicates && potentialDuplicates.length > 0) {
        // If it's a perfect match on phone or email, we might want to flag it heavily
        duplicateCandidates = potentialDuplicates;
      }
    }

    // Insert customer
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        customer_type: validData.customerType,
        name: validData.name,
        company_name: validData.companyName || null,
        phone: validData.phone || null,
        email: validData.email || null,
        address_line_1: validData.addressLine1 || null,
        address_line_2: validData.addressLine2 || null,
        city: validData.city || null,
        state: validData.state || null,
        country_code: validData.countryCode || null,
        notes: validData.notes || null,
        created_by_user_id: user.id
      })
      .select()
      .single();

    if (insertError) throw insertError;
    if (!newCustomer) throw new Error('Failed to create customer');

    return { 
      success: true, 
      data: mapCustomer(newCustomer),
      duplicateCandidates: duplicateCandidates.length > 0 ? duplicateCandidates : undefined
    };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message || 'An error occurred' };
  }
}

export async function updateCustomer(businessId: string, customerId: string, draft: UpdateCustomerDraft): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();
    
    // Validate input
    const parsed = updateCustomerSchema.safeParse(draft);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const validData = parsed.data;
    const updatePayload: Partial<Database['public']['Tables']['customers']['Update']> = {};
    
    if (validData.customerType !== undefined) updatePayload.customer_type = validData.customerType;
    if (validData.name !== undefined) updatePayload.name = validData.name;
    if (validData.companyName !== undefined) updatePayload.company_name = validData.companyName;
    if (validData.phone !== undefined) updatePayload.phone = validData.phone;
    if (validData.email !== undefined) updatePayload.email = validData.email;
    if (validData.addressLine1 !== undefined) updatePayload.address_line_1 = validData.addressLine1;
    if (validData.addressLine2 !== undefined) updatePayload.address_line_2 = validData.addressLine2;
    if (validData.city !== undefined) updatePayload.city = validData.city;
    if (validData.state !== undefined) updatePayload.state = validData.state;
    if (validData.countryCode !== undefined) updatePayload.country_code = validData.countryCode;
    if (validData.notes !== undefined) updatePayload.notes = validData.notes;

    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update(updatePayload)
      .eq('id', customerId)
      .eq('business_id', businessId) // Enforce tenant boundary
      .select()
      .single();

    if (updateError) throw updateError;
    if (!updatedCustomer) throw new Error('Customer not found or access denied');

    return { success: true, data: mapCustomer(updatedCustomer) };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message || 'An error occurred' };
  }
}

export async function archiveCustomer(businessId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();
    
    // Check if user has permission to archive
    const { data: hasRole } = await supabase.rpc('has_business_role', {
      business_id: businessId,
      allowed_roles: ['owner', 'business_admin', 'manager']
    });

    if (!hasRole) {
      return { success: false, error: 'You do not have permission to archive customers.' };
    }

    const { error } = await supabase
      .from('customers')
      .update({ 
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .eq('business_id', businessId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message || 'An error occurred' };
  }
}

export async function reactivateCustomer(businessId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();
    
    // Check if user has permission to reactivate
    const { data: hasRole } = await supabase.rpc('has_business_role', {
      business_id: businessId,
      allowed_roles: ['owner', 'business_admin', 'manager']
    });

    if (!hasRole) {
      return { success: false, error: 'You do not have permission to reactivate customers.' };
    }

    const { error } = await supabase
      .from('customers')
      .update({ 
        status: 'active',
        archived_at: null
      })
      .eq('id', customerId)
      .eq('business_id', businessId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message || 'An error occurred' };
  }
}

export async function getCustomer(businessId: string, customerId: string): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('business_id', businessId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Customer not found');

    return { success: true, data: mapCustomer(data) };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message || 'An error occurred' };
  }
}

export async function getCustomerList(
  businessId: string, 
  options: {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    status?: CustomerStatus | 'all';
    type?: CustomerType;
  } = {}
): Promise<{ success: boolean; data?: Customer[]; totalCount?: number; error?: string }> {
  try {
    const { supabase } = await getAuthAndSession();
    
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, Math.min(100, options.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId);

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    } else if (!options.status) {
      // Default to active only if not specified
      query = query.eq('status', 'active');
    }

    if (options.type) {
      query = query.eq('customer_type', options.type);
    }

    if (options.searchQuery && options.searchQuery.trim() !== '') {
      const sq = options.searchQuery.trim();
      query = query.or(`name.ilike.%${sq}%,email.ilike.%${sq}%,phone.ilike.%${sq}%,company_name.ilike.%${sq}%`);
    }

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return { 
      success: true, 
      data: (data || []).map(mapCustomer),
      totalCount: count || 0
    };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message || 'An error occurred' };
  }
}
