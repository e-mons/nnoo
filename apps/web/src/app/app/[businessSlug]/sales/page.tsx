import { Metadata } from 'next';
import { getSalesList } from '@/lib/actions/sales';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Receipt, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sales | NNOO',
  description: 'Manage your sales, payments, and refunds.',
};

export default async function SalesPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', resolvedParams.businessSlug)
    .single();

  if (!business) {
    return <div className="text-white">Business not found.</div>;
  }

  const items = await getSalesList(business.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#B8F25C]" />
            Sales
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Manage your sales for {business.name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${resolvedParams.businessSlug}/sales/new`}
            className="flex items-center gap-2 px-4 py-2 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            New Sale
          </Link>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        {!items || items.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No sales found</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Get started by creating your first sale.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Sale #</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Total ({business.currency_code})</th>
                  <th className="px-6 py-4 font-semibold">Payment Status</th>
                  <th className="px-6 py-4 font-semibold">Refund Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white/80">
                      {new Date(item.occurred_at).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/app/${resolvedParams.businessSlug}/sales/${item.id}`} className="font-medium text-[#B8F25C] hover:underline">
                        {item.sale_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-white/80">
                      {item.customers ? item.customers.name : <span className="italic text-white/40">Walk-in</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {(Number(item.total_minor) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize ${
                        item.payment_status === 'paid' ? 'bg-green-500/10 text-green-400' : 
                        item.payment_status === 'partially_paid' ? 'bg-yellow-500/10 text-yellow-400' : 
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {item.payment_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize ${
                        item.refund_status === 'none' ? 'text-white/40' : 
                        item.refund_status === 'refunded' ? 'bg-red-500/10 text-red-400' : 
                        'bg-orange-500/10 text-orange-400'
                      }`}>
                        {item.refund_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/${resolvedParams.businessSlug}/sales/${item.id}`}
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
    </div>
  );
}
