import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AIBusinessInsightService } from '@/server/ai';
import { AdvisorHubClient } from '@/components/advisor/AdvisorHubClient';

export const metadata: Metadata = {
  title: 'AI Advisor & Health | NNOO',
  description: 'Ask NNOO, business health scores, financial insights, and verified credit passports.',
};

interface AdvisorPageProps {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdvisorHubPage({ params, searchParams }: AdvisorPageProps) {
  const { businessSlug } = await params;
  const { tab } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/sign-in');
  }

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

  // Fetch initial verified facts & history with 0 Gemini calls
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
    <AdvisorHubClient
      businessId={business.id}
      businessSlug={businessSlug}
      businessName={business.name}
      currencyCode={business.currency_code || 'NGN'}
      userRole={membership.role}
      userName={user.email || 'Business User'}
      initialTab={tab || 'chat'}
      initialFacts={initialFacts}
      initialHistory={initialHistory || []}
    />
  );
}
