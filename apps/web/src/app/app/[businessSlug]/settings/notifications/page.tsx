import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface NotificationsPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function SettingsNotificationsPage({ params }: NotificationsPageProps) {
  const { businessSlug } = await params;
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Attention & Notification Center</h2>
        <p className="text-sm text-white/60">Review security, billing, and operational alerts.</p>
      </div>

      <NotificationCenter
        businessId={business.id}
        businessSlug={businessSlug}
      />
    </div>
  );
}
