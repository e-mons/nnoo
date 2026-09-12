import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppRootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if active platform admin first
  const { data: adminRecord } = await supabase
    .from('platform_admins')
    .select('role, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (adminRecord) {
    redirect('/admin');
  }

  // Fetch business memberships to find the first active business
  const { data: memberships } = await supabase
    .from('business_memberships')
    .select('business_id, membership_status, business:businesses(status)')
    .eq('user_id', user.id)
    .eq('membership_status', 'active');

  const activeMemberships = (memberships || []).filter(
    (m) => (m.business as any)?.status === 'active'
  );

  if (activeMemberships.length > 0) {
    // Redirect to the first active business dashboard
    redirect(`/app/${activeMemberships[0].business_id}`);
  }

  // Check if they have suspended businesses
  const hasSuspendedBusiness = (memberships || []).some(
    (m) => (m.business as any)?.status === 'suspended'
  );

  if (hasSuspendedBusiness) {
    redirect('/business-suspended');
  }

  // No businesses at all, go to onboarding
  redirect('/onboarding');
}
