import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AIBusinessInsightService } from '@/server/ai';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';

interface InsightsPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function BusinessInsightsPage({ params }: InsightsPageProps) {
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

  // Check role authorization for business insights
  const isAuthorized = ['owner', 'business_admin', 'manager', 'accountant'].includes(membership.role);
  if (!isAuthorized) {
    redirect(`/app/${businessSlug}/unauthorized`);
  }

  // 3. Fetch initial verified facts & history with 0 Gemini calls
  const initialFacts = await AIBusinessInsightService.getVerifiedFacts({
    supabase,
    businessId: business.id,
    userId: user.id,
    userRole: membership.role,
    summaryType: 'this_month',
  });

  const initialHistory = await AIBusinessInsightService.getSummaryHistory(
    supabase,
    business.id,
    user.id,
    10
  );

  return (
    <InsightsDashboard
      businessSlug={businessSlug}
      businessName={business.name}
      currencyCode={business.currency_code || 'NGN'}
      initialFacts={initialFacts}
      initialHistory={initialHistory}
    />
  );
}
