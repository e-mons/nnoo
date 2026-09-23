import React from 'react';
import { createAdminClient } from '../../../lib/supabase/admin';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';
import { MessageSquare, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Enquiries & Leads - NNOO Admin',
  description: 'Manage marketing contact enquiries and sales leads.',
};

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  await requireServerAdmin();
  const resolvedSearchParams = await searchParams;

  const statusFilter = resolvedSearchParams?.status || 'all';
  const query = resolvedSearchParams?.q || '';
  const page = parseInt(resolvedSearchParams?.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const adminSupabase = createAdminClient();
  let dbQuery = adminSupabase
    .from('contact_enquiries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    dbQuery = dbQuery.eq('status', statusFilter);
  }

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,business_name.ilike.%${query}%`);
  }

  const { data: enquiries, count, error } = await dbQuery.range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching enquiries:', error);
  }

  const totalPages = count ? Math.ceil(count / limit) : 0;

  const statusBadges: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    in_progress: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    closed: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-[#B8F25C]" />
            Public Contact Enquiries
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Real inbound marketing enquiries and customer sales leads.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg p-1 text-xs">
            {['all', 'new', 'in_progress', 'resolved', 'closed'].map((st) => (
              <Link
                key={st}
                href={`/admin/enquiries?status=${st}${query ? `&q=${query}` : ''}`}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-[#B8F25C] text-[#0A1C16]'
                    : 'text-[rgba(255,255,255,0.6)] hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[rgba(255,255,255,0.8)]">
            <thead className="bg-[rgba(255,255,255,0.02)] text-xs uppercase text-[rgba(255,255,255,0.5)] border-b border-[rgba(255,255,255,0.1)]">
              <tr>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Business Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Submitted</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {enquiries && enquiries.length > 0 ? (
                enquiries.map((enquiry: any) => (
                  <tr key={enquiry.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{enquiry.name}</div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)]">{enquiry.email}</div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {enquiry.business_name || '—'}
                    </td>
                    <td className="px-6 py-4 capitalize text-[rgba(255,255,255,0.7)]">
                      {enquiry.category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-[rgba(255,255,255,0.5)] text-xs">
                      {new Date(enquiry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${statusBadges[enquiry.status] || 'bg-gray-500/10 text-gray-400'}`}>
                        {enquiry.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/enquiries/${enquiry.id}`}
                        className="inline-flex items-center text-[#B8F25C] hover:underline text-xs font-semibold"
                      >
                        Inspect <ChevronRight className="ml-1 h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[rgba(255,255,255,0.5)]">
                    No contact enquiries found for this filter.
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
            Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count} enquiries
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link 
                href={`/admin/enquiries?page=${page - 1}&status=${statusFilter}${query ? `&q=${query}` : ''}`}
                className="px-4 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] text-sm transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link 
                href={`/admin/enquiries?page=${page + 1}&status=${statusFilter}${query ? `&q=${query}` : ''}`}
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
