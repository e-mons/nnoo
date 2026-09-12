import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FeatureModule, hasPermission, ROLE_PERMISSIONS } from './rbac-client';

export { ROLE_PERMISSIONS };
export type { FeatureModule };

/**
 * Server-side utility to enforce RBAC access.
 * Re-fetches membership from Supabase for security (prevents client token spoofing).
 * @param businessSlug 
 * @param feature 
 */
export async function requireRole(businessSlug: string, feature: FeatureModule) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { data: membership } = await supabase
    .from('business_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('business_id', businessSlug)
    .eq('membership_status', 'active')
    .single();

  if (!membership || !hasPermission(membership.role, feature)) {
    redirect(`/app/${businessSlug}/unauthorized`);
  }
}
