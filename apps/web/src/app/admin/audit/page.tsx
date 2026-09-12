/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createAdminClient } from '../../../lib/supabase/admin';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import { ShieldCheck, Activity, Search, Filter, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Audit Log - NNOO Admin',
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; targetType?: string; q?: string }>;
}) {
  await requireServerAdmin();
  const resolvedSearchParams = await searchParams;

  const page = parseInt(resolvedSearchParams?.page || '1', 10);
  const filterAction = resolvedSearchParams?.action || '';
  const filterTargetType = resolvedSearchParams?.targetType || 'all';
  const query = resolvedSearchParams?.q || '';
  const limit = 50;
  const offset = (page - 1) * limit;

  const adminClient = createAdminClient();

  let dbQuery = adminClient
    .from('platform_audit_events')
    .select(`
      id, 
      action, 
      target_type, 
      target_id, 
      reason, 
      metadata,
      created_at, 
      actor:platform_admins!actor_id(user_id, role)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filterAction) {
    dbQuery = dbQuery.eq('action', filterAction);
  }
  if (filterTargetType && filterTargetType !== 'all') {
    dbQuery = dbQuery.eq('target_type', filterTargetType);
  }
  if (query) {
    dbQuery = dbQuery.or(`action.ilike.%${query}%,reason.ilike.%${query}%`);
  }

  const { data: events, count, error } = await dbQuery.range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching audit logs:', error);
  }

  const totalPages = count ? Math.ceil(count / limit) : 0;

  const targetTypes = ['all', 'business', 'user', 'enquiry', 'billing_plans', 'system_control'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#B8F25C]" />
            Platform Audit Log
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Immutable, append-only record of sensitive platform administrative actions.
          </p>
        </div>

        <form className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,255,255,0.4)]" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search action or reason..."
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-[rgba(255,255,255,0.4)] focus:outline-none focus:ring-2 focus:ring-[#B8F25C]"
          />
          {filterTargetType !== 'all' && (
            <input type="hidden" name="targetType" value={filterTargetType} />
          )}
        </form>
      </div>

      {/* Target Type Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {targetTypes.map((tt) => (
          <Link
            key={tt}
            href={`/admin/audit?targetType=${tt}${query ? `&q=${query}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
              filterTargetType === tt
                ? 'bg-[#B8F25C] text-[#0A1C16]'
                : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            {tt.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[rgba(255,255,255,0.8)]">
            <thead className="bg-[rgba(255,255,255,0.02)] text-xs uppercase text-[rgba(255,255,255,0.5)] border-b border-[rgba(255,255,255,0.1)]">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Actor Role</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Target Entity</th>
                <th className="px-6 py-4 font-medium max-w-xs">Audit Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {events && events.length > 0 ? (
                events.map((e: any) => {
                  const actorRole = Array.isArray(e.actor) ? e.actor[0]?.role : e.actor?.role;
                  return (
                    <tr key={e.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-[rgba(255,255,255,0.6)] whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[rgba(255,255,255,0.05)] text-[#B8F25C] border border-[rgba(184,242,92,0.2)] capitalize">
                          {(actorRole || 'admin').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-[#B8F25C]" />
                          <span className="font-semibold text-white uppercase text-xs tracking-wider">
                            {e.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <span className="text-[rgba(255,255,255,0.4)] uppercase tracking-wider font-semibold text-[10px]">
                            {e.target_type}:
                          </span>
                          <br />
                          {e.target_type === 'user' && e.target_id ? (
                            <Link href={`/admin/users/${e.target_id}`} className="font-mono text-[#B8F25C] hover:underline inline-flex items-center gap-1">
                              {e.target_id.slice(0, 18)}... <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : e.target_type === 'business' && e.target_id ? (
                            <Link href={`/admin/businesses/${e.target_id}`} className="font-mono text-[#B8F25C] hover:underline inline-flex items-center gap-1">
                              {e.target_id.slice(0, 18)}... <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : e.target_type === 'enquiry' && e.target_id ? (
                            <Link href={`/admin/enquiries/${e.target_id}`} className="font-mono text-[#B8F25C] hover:underline inline-flex items-center gap-1">
                              {e.target_id.slice(0, 18)}... <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : e.target_type === 'billing_plans' ? (
                            <Link href="/admin/billing/plans" className="font-mono text-[#B8F25C] hover:underline inline-flex items-center gap-1">
                              {e.target_id ? `${e.target_id.slice(0, 18)}...` : 'billing_plans'} <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="font-mono text-[rgba(255,255,255,0.7)]">{e.target_id || 'Global'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-white text-xs" title={e.reason}>{e.reason || '—'}</p>
                        {e.metadata && Object.keys(e.metadata).length > 0 && (
                          <div className="mt-1">
                            <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-mono truncate block max-w-xs">
                              {JSON.stringify(e.metadata)}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[rgba(255,255,255,0.5)]">
                    No audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[rgba(255,255,255,0.5)]">
            Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count} records
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link 
                href={`/admin/audit?page=${page - 1}${filterTargetType !== 'all' ? `&targetType=${filterTargetType}` : ''}${query ? `&q=${query}` : ''}`}
                className="px-4 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] text-sm transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link 
                href={`/admin/audit?page=${page + 1}${filterTargetType !== 'all' ? `&targetType=${filterTargetType}` : ''}${query ? `&q=${query}` : ''}`}
                className="px-4 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] text-sm transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
