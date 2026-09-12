'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateBusinessProfile(businessId: string, businessSlug: string, formData: FormData) {
  const supabase = await createClient();

  const updates = {
    name: formData.get('name') as string,
    legal_name: formData.get('legal_name') as string,
    industry: formData.get('industry') as string,
    country_code: formData.get('country_code') as string,
    currency_code: formData.get('currency_code') as string,
    timezone: formData.get('timezone') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    address_line_1: formData.get('address_line_1') as string,
    address_line_2: formData.get('address_line_2') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    registration_number: formData.get('registration_number') as string,
    tax_identifier: formData.get('tax_identifier') as string,
  };

  // Only validate required fields
  if (!updates.name || !updates.industry || !updates.country_code || !updates.currency_code) {
    return { error: 'Name, Industry, Country, and Currency are required.' };
  }

  const { error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', businessId);

  if (error) {
    console.error('Error updating business:', error);
    return { error: error.message };
  }

  revalidatePath(`/app/${businessSlug}/settings`);
  
  return { success: true };
}
