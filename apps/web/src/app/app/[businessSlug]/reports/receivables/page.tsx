import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ReceivablesReportPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const resolvedParams = await params;
  const { businessSlug } = resolvedParams;
  
  const supabase = await createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', businessSlug)
    .single();

  if (!business) notFound();

  // Fetch unpaid sales (Accounts Receivable)
  const { data: sales, error } = await supabase
    .from('sales')
    .select('id, sale_number, effective_date, total_minor, payment_status, customers(name)')
    .eq('business_id', business.id)
    .neq('payment_status', 'paid')
    .gt('total_minor', 0)
    .order('effective_date', { ascending: false });

  if (error) {
    console.error(error);
  }

  const formatMoney = (minor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: business.currency_code
    }).format(minor / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Accounts Receivable</h2>
          <p className="text-sm text-white/60">Outstanding customer balances from unpaid sales.</p>
        </div>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Sale Number</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold text-right">Total Amount</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sales?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                    No outstanding receivables found.
                  </td>
                </tr>
              )}
              {sales?.map((s: any) => (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">{new Date(s.effective_date).toLocaleDateString('en-US')}</td>
                  <td className="px-6 py-4">
                    <Link href={`/app/${businessSlug}/sales/${s.id}`} className="hover:underline">
                      {s.sale_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{s.customers?.name || 'Walk-in / Unknown'}</td>
                  <td className="px-6 py-4 text-right font-medium text-orange-400">{formatMoney(s.total_minor)}</td>
                  <td className="px-6 py-4 text-center capitalize">
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-md text-xs font-medium border border-orange-500/30">
                      {s.payment_status.replace('_', ' ')}
                    </span>
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
