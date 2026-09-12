/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';
import { ChevronLeft, Briefcase, CreditCard, ShieldCheck, Activity, ExternalLink } from 'lucide-react';
import { BusinessStatusActions } from './BusinessStatusActions';

export const metadata = {
  title: 'Business Details - NNOO Admin',
};

export default async function AdminBusinessDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireServerAdmin();
  const resolvedParams = await params;

  const adminClient = createAdminClient();

  const [businessResult, membershipsResult, subscriptionResult, auditResult] = await Promise.all([
    adminClient.from('businesses').select('*').eq('id', resolvedParams.id).single(),
    adminClient
      .from('business_memberships')
      .select('id, role, membership_status, created_at, user_id')
      .eq('business_id', resolvedParams.id),
    adminClient
      .from('business_subscriptions')
      .select(`
        id,
        provider_environment,
        provider_subscription_code,
        normalized_status,
        next_payment_at,
        created_at,
        billing_plans ( id, name, code, amount_minor, currency_code, billing_interval )
      `)
      .eq('business_id', resolvedParams.id)
      .maybeSingle(),
    adminClient
      .from('platform_audit_events')
      .select(`
        id,
        action,
        target_type,
        target_id,
        reason,
        created_at,
        actor:platform_admins!actor_id(role)
      `)
      .eq('target_type', 'business')
      .eq('target_id', resolvedParams.id)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  if (businessResult.error || !businessResult.data) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-red-400">Business not found or error loading data.</p>
        <Link href="/admin/businesses" className="text-[#B8F25C] hover:underline mt-4 inline-block">Back to Businesses</Link>
      </div>
    );
  }

  const business = businessResult.data;
  const membershipsData = membershipsResult.data || [];
  const subscription = subscriptionResult.data;
  const auditEvents = auditResult.data || [];
  const userIds = membershipsData.map((m: any) => m.user_id);

  let profiles: any[] = [];
  let authUsers: any[] = [];
  if (userIds.length > 0) {
    const [{ data: pData }, { data: aData }] = await Promise.all([
      adminClient.from('profiles').select('id, first_name, last_name').in('id', userIds),
      adminClient.auth.admin.listUsers().catch(() => ({ data: { users: [] }, error: null })),
    ]);
    if (pData) profiles = pData;
    if (aData?.users) authUsers = aData.users;
  }

  const authMap = new Map(authUsers.map((au) => [au.id, au]));

  const memberships = membershipsData.map((m: any) => {
    const profile = profiles.find((p) => p.id === m.user_id) || {};
    const authUser = authMap.get(m.user_id);
    return {
      ...m,
      membership_id: m.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: authUser?.email,
    };
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <Link href="/admin/businesses" className="inline-flex items-center text-sm text-[rgba(255,255,255,0.6)] hover:text-white transition-colors mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Businesses
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-[rgba(255,255,255,0.05)] rounded-full border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-[rgba(255,255,255,0.4)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {business.name}
              </h1>
              {business.legal_name && business.legal_name !== business.name && (
                <p className="text-xs text-[rgba(255,255,255,0.6)] mt-0.5">Legal: {business.legal_name}</p>
              )}
              <p className="text-[rgba(255,255,255,0.6)] text-sm font-mono mt-1">{business.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/app/${business.id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white text-xs font-semibold transition-colors"
            >
              Launch App <ExternalLink className="h-3.5 w-3.5 text-[#B8F25C]" />
            </Link>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              business.status === 'active' 
                ? 'bg-[rgba(184,242,92,0.1)] text-[#B8F25C]' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {business.status}
            </span>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Business Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Industry</label>
            <p className="text-white">{business.industry || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Currency</label>
            <p className="text-white font-mono">{business.currency_code || 'NGN'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Country / State</label>
            <p className="text-white">{business.country_code} {business.state ? `/ ${business.state}` : ''} {business.city ? `(${business.city})` : ''}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Registration Number</label>
            <p className="text-white">{business.registration_number || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Contact Email & Phone</label>
            <p className="text-white text-xs font-mono">{business.email || '—'} {business.phone ? `· ${business.phone}` : ''}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Tax Identifier & Timezone</label>
            <p className="text-white text-xs">{business.tax_identifier ? `Tax ID: ${business.tax_identifier}` : 'No Tax ID'} · {business.timezone || 'Africa/Lagos'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Created Date</label>
            <p className="text-white">{new Date(business.created_at).toLocaleString()}</p>
          </div>
        </div>

        <BusinessStatusActions businessId={business.id} currentStatus={business.status} />
      </div>

      {/* Subscription Information */}
      <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#B8F25C]" /> Active Subscription
          </h2>
          {subscription && (
            <Link
              href={`/admin/billing/subscriptions/${subscription.id}`}
              className="text-xs text-[#B8F25C] hover:underline"
            >
              View Billing Subscription &rarr;
            </Link>
          )}
        </div>

        {subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Plan</label>
              <p className="text-white font-semibold">{(subscription.billing_plans as any)?.name || 'Default Plan'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Normalized Status</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                subscription.normalized_status === 'active'
                  ? 'bg-[rgba(184,242,92,0.1)] text-[#B8F25C]'
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                {subscription.normalized_status.toUpperCase()}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Environment</label>
              <p className="text-white font-mono text-xs uppercase">{subscription.provider_environment}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Next Payment Date</label>
              <p className="text-white">{subscription.next_payment_at ? new Date(subscription.next_payment_at).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-[rgba(255,255,255,0.5)]">
            No paid subscription recorded for this business (Standard / Free tier).
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)]">
          <h2 className="text-lg font-medium text-white">Team Members ({memberships.length})</h2>
        </div>
        
        {memberships.length > 0 ? (
          <div className="divide-y divide-[rgba(255,255,255,0.05)]">
            {memberships.map((m: any) => {
              const name = `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown';
              return (
                <div key={m.membership_id} className="p-6 flex items-center justify-between hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <div>
                    <Link href={`/admin/users/${m.user_id}`} className="text-white font-medium hover:text-[#B8F25C] transition-colors">
                      {name || m.email || 'No Name Provided'}
                    </Link>
                    {m.email && name ? (
                      <p className="text-xs text-[rgba(255,255,255,0.4)] font-mono">{m.email}</p>
                    ) : null}
                    <p className="text-sm text-[rgba(255,255,255,0.5)] mt-0.5">
                      Role: <span className="text-white capitalize">{m.role.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    m.membership_status === 'active' ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {m.membership_status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-[rgba(255,255,255,0.5)]">
            No team members found for this business.
          </div>
        )}
      </div>

      {/* Business Audit Trail */}
      {auditEvents.length > 0 && (
        <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#B8F25C]" /> Business Audit Events
            </h2>
            <Link href="/admin/audit" className="text-xs text-[#B8F25C] hover:underline">
              View All Audit Logs &rarr;
            </Link>
          </div>
          <div className="divide-y divide-[rgba(255,255,255,0.05)]">
            {auditEvents.map((evt: any) => (
              <div key={evt.id} className="p-5 flex items-center justify-between hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#B8F25C]" />
                    <span className="text-xs font-bold text-white uppercase">{evt.action.replace(/_/g, ' ')}</span>
                  </div>
                  {evt.reason && (
                    <p className="text-xs text-[rgba(255,255,255,0.7)] italic">Reason: {evt.reason}</p>
                  )}
                </div>
                <div className="text-right text-xs text-[rgba(255,255,255,0.4)] font-mono">
                  {new Date(evt.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
