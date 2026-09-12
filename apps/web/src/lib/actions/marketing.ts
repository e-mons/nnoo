'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { enquirySchema } from '@nnoo/validation';

export async function submitEnquiryAction(formData: FormData) {
  // Validate honeypot first
  const honeypot = formData.get('honeypot');
  if (honeypot) {
    // Silently reject if honeypot is filled
    return { success: true };
  }

  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    business_name: formData.get('business_name') || undefined,
    category: formData.get('category'),
    message: formData.get('message'),
  };

  const validation = enquirySchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Use the admin client (Service Role) to bypass RLS and securely insert the lead
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('contact_enquiries')
    .insert({
      name: validation.data.name,
      email: validation.data.email,
      phone: validation.data.phone || null,
      business_name: validation.data.business_name || null,
      category: validation.data.category,
      message: validation.data.message,
      status: 'new',
      source: 'homepage'
    });

  if (error) {
    console.error('Error submitting enquiry:', error);
    return { error: 'We could not submit your message at this time. Please try again later.' };
  }

  return { success: true };
}
