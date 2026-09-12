'use server';

import { createClient } from '@/lib/supabase/server';
import { businessOnboardingSchema } from '@nnoo/validation';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createBusinessAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Not authenticated' };
  }

  const rawData = {
    name: formData.get('name'),
    industry: formData.get('industry'),
    country_code: formData.get('country_code') || 'NG',
    phone: formData.get('phone') || '',
    email: formData.get('email') || '',
  };

  const validation = businessOnboardingSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { error } = await supabase.rpc('create_business_with_owner', {
    name: validation.data.name,
    industry: validation.data.industry,
    country_code: validation.data.country_code,
    phone: validation.data.phone || undefined,
    email: validation.data.email || undefined,
  });

  if (error) {
    console.error('Error creating business:', error);
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');
  redirect('/app');
}

export async function updateBusinessAction(businessId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Not authenticated' };
  }

  const rawData = {
    name: (formData.get('name') as string) || undefined,
    industry: (formData.get('industry') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
  };

  const { error } = await supabase
    .from('businesses')
    .update(rawData)
    .eq('id', businessId);

  if (error) {
    console.error('Error updating business:', error);
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');
  return { success: true };
}
