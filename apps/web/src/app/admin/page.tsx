import React from 'react';
import { createAdminClient } from '../../lib/supabase/admin';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import { Users, Briefcase, Activity, ShieldAlert, CreditCard, MessageSquare, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Platform Overview - NNOO Admin',
  description: 'Real-time operational metrics and management overview for the NNOO platform.',
};

export default async function AdminDashboardPage() {
  await requireServerAdmin();

  const adminClient = createAdminClient();

  // Fetch canonical operational metrics (Zero Gemini calls, strictly deterministic database queries)
  const [
    { count: totalUsers },
    { count: suspendedUsers },
    { count: totalBusinesses },
    { count: suspendedBusinesses },
    { count: activeSubscriptions },
    { count: pastDueSubscriptions },
    { count: openEnquiries },
    { data: recentAuditEvents },
    { count: totalInvocations },
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'suspended'),
    adminClient.from('businesses').select('*', { count: 'exact', head: true }),
    adminClient.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    adminClient.from('business_subscriptions').select('*', { count: 'exact', head: true }).eq('normalized_status', 'active'),
    adminClient.from('business_subscriptions').select('*', { count: 'exact', head: true }).eq('normalized_status', 'past_due'),
    adminClient.from('contact_enquiries').select('*', { count: 'exact', head: true }).in('status', ['new', 'in_progress']),
    adminClient.from('platform_audit_events')
      .select(`
        id, 
        action, 
        target_type, 
        target_id,
        reason,
        created_at, 
        actor:platform_admins!actor_id(role)
      `)
      .order('created_at', { ascending: false })
      .limit(6),
    adminClient.from('ai_invocations').select('*', { count: 'exact', head: true }),
  ]);

  const activeUsers = (totalUsers || 0) - (suspendedUsers || 0);
  const activeBusinesses = (totalBusinesses || 0) - (suspendedBusinesses || 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B8F25C]/10 text-[#B8F25C] uppercase tracking-wider">
              NNOO Platform Control
            </span>
            <span className="text-xs text-[rgba(255,255,255,0.4)]">Production Ready</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-2">Platform Overview</h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Authoritative operational health, tenant metrics, and platform governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/intelligence"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8F25C] text-[#0A1C16] font-semibold text-sm hover:bg-[#a3db4e] transition-colors"
          >
            <Cpu className="h-4 w-4" />
            Intelligence Operations
          </Link>
        </div>
      </header>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 hover:border-[rgba(255,255,255,0.2)] transition-colors">
          <div className="flex items-center justify-between text-[#B8F25C] mb-4">
            <div className="flex items-center gap-2 font-medium text-white text-sm">
              <Briefcase className="h-5 w-5 text-[#B8F25C]" />
              Businesses
            </div>
            <Link href="/admin/businesses" className="text-xs text-[#B8F25C] hover:underline flex items-center gap-1">
              View <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-3xl font-bold text-white">{totalBusinesses || 0}</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-400 font-medium">{activeBusinesses} Active</span>
            <span className="text-[rgba(255,255,255,0.3)]">•</span>
            <span className={suspendedBusinesses ? 'text-red-400 font-medium' : 'text-[rgba(255,255,255,0.5)]'}>
              {suspendedBusinesses || 0} Suspended
            </span>
          </div>
        </div>

        <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 hover:border-[rgba(255,255,255,0.2)] transition-colors">
          <div className="flex items-center justify-between text-[#B8F25C] mb-4">
            <div className="flex items-center gap-2 font-medium text-white text-sm">
              <Users className="h-5 w-5 text-[#B8F25C]" />
              Platform Users
            </div>
            <Link href="/admin/users" className="text-xs text-[#B8F25C] hover:underline flex items-center gap-1">
              View <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-3xl font-bold text-white">{totalUsers || 0}</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-400 font-medium">{activeUsers} Active</span>
            <span className="text-[rgba(255,255,255,0.3)]">•</span>
            <span className={suspendedUsers ? 'text-red-400 font-medium' : 'text-[rgba(255,255,255,0.5)]'}>
              {suspendedUsers || 0} Suspended
            </span>
          </div>
        </div>

        <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 hover:border-[rgba(255,255,255,0.2)] transition-colors">
          <div className="flex items-center justify-between text-[#B8F25C] mb-4">
            <div className="flex items-center gap-2 font-medium text-white text-sm">
              <CreditCard className="h-5 w-5 text-[#B8F25C]" />
              SaaS Billing
            </div>
            <Link href="/admin/billing" className="text-xs text-[#B8F25C] hover:underline flex items-center gap-1">
              Billing <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-3xl font-bold text-white">{activeSubscriptions || 0}</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-400 font-medium">{activeSubscriptions || 0} Active Subscriptions</span>
            {pastDueSubscriptions ? (
              <>
                <span className="text-[rgba(255,255,255,0.3)]">•</span>
                <span className="text-red-400 font-medium">{pastDueSubscriptions} Past Due</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 hover:border-[rgba(255,255,255,0.2)] transition-colors">
          <div className="flex items-center justify-between text-[#B8F25C] mb-4">
            <div className="flex items-center gap-2 font-medium text-white text-sm">
              <MessageSquare className="h-5 w-5 text-[#B8F25C]" />
              Open Enquiries
            </div>
            <Link href="/admin/enquiries" className="text-xs text-[#B8F25C] hover:underline flex items-center gap-1">
              Enquiries <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-3xl font-bold text-white">{openEnquiries || 0}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-[rgba(255,255,255,0.5)]">
            <span>Public contact & sales leads</span>
          </div>
        </div>
      </div>

      {/* Operational Subsystems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#B8F25C]/10 text-[#B8F25C]">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Intelligence System</h3>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">AI Invocations & Telemetry</p>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-[rgba(255,255,255,0.05)] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,255,0.6)]">Total Telemetry Invocations</span>
              <span className="text-white font-mono font-medium">{totalInvocations || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,255,0.6)]">Runtime AI Model</span>
              <span className="text-[#B8F25C] font-mono text-xs">{process.env.GEMINI_MODEL_ID || 'gemini-3.6-flash'}</span>
            </div>
          </div>
          <Link
            href="/admin/intelligence"
            className="block text-center py-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white text-xs font-semibold transition-colors"
          >
            Manage AI Controls & Telemetry &rarr;
          </Link>
        </div>

        <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#B8F25C]/10 text-[#B8F25C]">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Paystack SaaS Billing</h3>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">SaaS Subscriptions & Webhooks</p>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-[rgba(255,255,255,0.05)] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,255,0.6)]">Active Subscriptions</span>
              <span className="text-emerald-400 font-mono font-medium">{activeSubscriptions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,255,0.6)]">Billing Integration Mode</span>
              <span className="text-blue-400 font-mono text-xs uppercase">TEST / Verified</span>
            </div>
          </div>
          <Link
            href="/admin/billing/subscriptions"
            className="block text-center py-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white text-xs font-semibold transition-colors"
          >
            Inspect Subscriptions & Plans &rarr;
          </Link>
        </div>

        <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#B8F25C]/10 text-[#B8F25C]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Platform Governance</h3>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">Immutable Audit Events</p>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-[rgba(255,255,255,0.05)] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,255,0.6)]">Security Domain</span>
              <span className="text-white font-medium">Platform Admin</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgba(255,255,255,0.6)]">Financial Super-User</span>
              <span className="text-red-400 font-medium text-xs">DISABLED / Non-Authoritative</span>
            </div>
          </div>
          <Link
            href="/admin/audit"
            className="block text-center py-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white text-xs font-semibold transition-colors"
          >
            View Full Audit Trail &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Admin Audit Activity */}
      <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Platform Audit Events</h2>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-0.5">Immutable record of high-impact administrative actions</p>
          </div>
          <Link href="/admin/audit" className="text-sm text-[#B8F25C] hover:underline flex items-center gap-1 font-medium">
            View all audit events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {recentAuditEvents && recentAuditEvents.length > 0 ? (
          <div className="divide-y divide-[rgba(255,255,255,0.05)]">
            {recentAuditEvents.map((event: any) => {
              const actorRole = Array.isArray(event.actor) ? event.actor[0]?.role : event.actor?.role;
              return (
                <div key={event.id} className="py-3.5 flex items-center justify-between hover:bg-[rgba(255,255,255,0.02)] px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-[#B8F25C]">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        <span className="uppercase text-xs font-bold text-[#B8F25C] mr-2">
                          {event.action.replace(/_/g, ' ')}
                        </span>
                        on <span className="capitalize text-[rgba(255,255,255,0.8)]">{event.target_type}</span>
                        {event.target_id ? (
                          event.target_type === 'user' ? (
                            <Link href={`/admin/users/${event.target_id}`} className="font-mono text-xs text-[#B8F25C] hover:underline ml-2">
                              ({event.target_id.slice(0, 8)}...)
                            </Link>
                          ) : event.target_type === 'business' ? (
                            <Link href={`/admin/businesses/${event.target_id}`} className="font-mono text-xs text-[#B8F25C] hover:underline ml-2">
                              ({event.target_id.slice(0, 8)}...)
                            </Link>
                          ) : (
                            <span className="font-mono text-xs text-[rgba(255,255,255,0.4)] ml-2">({event.target_id.slice(0, 8)}...)</span>
                          )
                        ) : null}
                      </p>
                      {event.reason ? (
                        <p className="text-xs text-[rgba(255,255,255,0.6)] mt-0.5 max-w-xl truncate">
                          Reason: {event.reason}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(255,255,255,0.1)] text-white capitalize">
                      {(actorRole || 'admin').replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[rgba(255,255,255,0.5)] text-center py-8 text-sm">No recent administrative activity found.</p>
        )}
      </div>
    </div>
  );
}
