import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInvoicesList } from '@/lib/actions/invoices';

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const resolvedParams = await params;
  const businessSlug = resolvedParams.businessSlug;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessSlug)
    .single();

  if (!business) {
    notFound();
  }

  const invoices = await getInvoicesList(business.id, { limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-white/60">Manage your billing and customer invoices</p>
        </div>
        <Link 
          href={`/app/${businessSlug}/invoices/new`}
          className="px-4 py-2 bg-[#B8F25C] text-[#0A1C16] font-bold rounded-lg hover:bg-[#a3d951] transition-colors"
        >
          Create Invoice
        </Link>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest">Invoice #</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest">Customer</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest">Status</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest text-right">Total</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoices?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/50">
                  No invoices found. Create one to get started.
                </td>
              </tr>
            )}
            {invoices?.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                <td className="p-4">
                  <Link href={`/app/${businessSlug}/invoices/${inv.id}`} className="block">
                    <span className="font-medium text-white group-hover:text-[#B8F25C] transition-colors">
                      {inv.invoice_number || 'DRAFT'}
                    </span>
                  </Link>
                </td>
                <td className="p-4 text-white/80">
                  {inv.customers?.name || 'Unknown'}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                    ${inv.document_status === 'draft' ? 'bg-gray-500/20 text-gray-300' : ''}
                    ${inv.document_status === 'issued' ? 'bg-[#B8F25C]/20 text-[#B8F25C]' : ''}
                    ${inv.document_status === 'voided' ? 'bg-red-500/20 text-red-300' : ''}
                  `}>
                    {inv.document_status}
                  </span>
                </td>
                <td className="p-4 text-right text-white">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: inv.currency_code
                  }).format(inv.total_minor / 100)}
                </td>
                <td className="p-4 text-sm text-white/60">
                  {inv.issue_date || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
