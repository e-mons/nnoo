import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AskNnooChat } from '@/components/assistant/AskNnooChat';

interface AssistantPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function AskNnooPage({ params }: AssistantPageProps) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/sign-in');
  }

  // 2. Fetch business & active membership
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', businessSlug)
    .single();

  if (bizError || !business) {
    notFound();
  }

  const { data: membership, error: memError } = await supabase
    .from('business_memberships')
    .select('role, membership_status')
    .eq('business_id', business.id)
    .eq('user_id', user.id)
    .single();

  if (memError || !membership || membership.membership_status !== 'active') {
    notFound();
  }

  return (
    <div className="w-full">
      <AskNnooChat
        businessId={business.id}
        businessSlug={businessSlug}
        userRole={membership.role}
        userName={user.email || 'Business User'}
      />
    </div>
  );
}
