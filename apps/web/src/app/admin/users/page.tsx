/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createAdminClient } from '../../../lib/supabase/admin';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Manage Users - NNOO Admin',
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireServerAdmin();
  const resolvedParams = await searchParams;
  const query = resolvedParams?.q || '';
  const page = parseInt(resolvedParams?.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const adminClient = createAdminClient();

  let dbQuery = adminClient
    .from('profiles')
    .select('id, first_name, last_name, account_status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (query) {
    // In a real production system, this might require a full-text search index or pg_trgm.
    // We do simple ilike for name fields for now.
    dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
  }

  const [{ data: users, count, error }, authUsersResult] = await Promise.all([
    dbQuery.range(offset, offset + limit - 1),
    adminClient.auth.admin.listUsers().catch(() => ({ data: { users: [] }, error: null })),
  ]);

  if (error) {
    console.error('Error fetching users:', error);
  }

  const authUserMap = new Map((authUsersResult?.data?.users || []).map((au: any) => [au.id, au]));
  const totalPages = count ? Math.ceil(count / limit) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">Manage platform users and their access.</p>
        </div>
        
        <form className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgba(255,255,255,0.4)]" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search users..."
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-[rgba(255,255,255,0.4)] focus:outline-none focus:ring-2 focus:ring-[#B8F25C]"
          />
        </form>
      </div>

      <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[rgba(255,255,255,0.8)]">
            <thead className="bg-[rgba(255,255,255,0.02)] text-xs uppercase text-[rgba(255,255,255,0.5)] border-b border-[rgba(255,255,255,0.1)]">
              <tr>
                <th className="px-6 py-4 font-medium">Name & Email</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {users && users.length > 0 ? (
                users.map((u: any) => {
                  const authUser = authUserMap.get(u.id);
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                  return (
                    <tr key={u.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">
                          {fullName || authUser?.email || 'No Name Provided'}
                        </div>
                        {authUser?.email && fullName ? (
                          <div className="text-xs text-[rgba(255,255,255,0.5)] font-mono">{authUser.email}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.account_status === 'active' 
                            ? 'bg-[rgba(184,242,92,0.1)] text-[#B8F25C]' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {u.account_status.toUpperCase()}
                        </span>
                      </td>
                    <td className="px-6 py-4 text-[rgba(255,255,255,0.5)]">
                      {new Date(u.created_at).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center text-[#B8F25C] hover:underline"
                      >
                        View Details <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[rgba(255,255,255,0.5)]">
                    No users found.
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
            Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count} users
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link 
                href={`/admin/users?page=${page - 1}${query ? `&q=${query}` : ''}`}
                className="px-4 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] text-sm transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link 
                href={`/admin/users?page=${page + 1}${query ? `&q=${query}` : ''}`}
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
