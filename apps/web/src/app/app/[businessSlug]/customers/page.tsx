import { Metadata } from 'next';
import { getCustomerList } from '@/lib/actions/customer';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Users, Search, Settings } from 'lucide-react';
import { CustomerStatus, CustomerType } from '@nnoo/contracts';

export const metadata: Metadata = {
  title: 'Customers | NNOO',
  description: 'Manage your business customers.',
};

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  
  // Resolve businessId from slug
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', resolvedParams.businessSlug)
    .single();

  if (!business) {
    return <div className="text-white p-8">Business not found.</div>;
  }

  // Parse search params for filtering
  const q = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;
  const rawType = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : undefined;
  const rawStatus = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;

  const type: CustomerType | undefined =
    rawType === 'individual' || rawType === 'business' ? rawType : undefined;

  const status: CustomerStatus | 'all' =
    rawStatus === 'active' || rawStatus === 'archived' || rawStatus === 'all'
      ? rawStatus
      : 'active';

  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) || 1 : 1;

  const { data: customers, error, totalCount } = await getCustomerList(business.id, {
    searchQuery: q,
    type,
    status,
    page,
    pageSize: 50
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#B8F25C]" />
            Customers
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Manage your customers for {business.name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${resolvedParams.businessSlug}/customers/new`}
            className="flex items-center gap-2 px-4 py-2 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(184,242,92,0.2)]"
          >
            <Plus className="w-4 h-4" />
            New Customer
          </Link>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <form className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search name, phone, email..."
              className="bg-[#0A1C16] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white w-full focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
          <select
            name="type"
            defaultValue={type || ''}
            className="bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white w-full sm:w-40 focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
          >
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
          <select
            name="status"
            defaultValue={status}
            className="bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white w-full sm:w-40 focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All Statuses</option>
          </select>
          <button
            type="submit"
            className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-6 py-2 text-sm font-medium transition-colors w-full sm:w-auto"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        {error ? (
          <div className="p-8 text-center text-red-400">
            Failed to load customers: {error}
          </div>
        ) : !customers || customers.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No customers found</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
              Get started by adding your first customer record.
            </p>
            <Link
              href={`/app/${resolvedParams.businessSlug}/customers/new`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{customer.name}</div>
                      {customer.companyName && (
                        <div className="text-xs text-white/50 mt-1">
                          {customer.companyName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white/80">{customer.email || <span className="text-white/30 italic">No email</span>}</div>
                      <div className="text-xs text-white/50 mt-1">{customer.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize ${
                        customer.customerType === 'business' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {customer.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {customer.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-white/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/${resolvedParams.businessSlug}/customers/${customer.id}`}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg inline-flex transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {totalCount !== undefined && totalCount > 0 && (
        <div className="flex justify-between items-center text-sm text-white/50 px-2">
          <span>Showing {customers?.length} of {totalCount} customers</span>
        </div>
      )}
    </div>
  );
}
