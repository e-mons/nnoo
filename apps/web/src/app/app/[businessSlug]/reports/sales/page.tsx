import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';

export default async function SalesReportPage({
  params,
  searchParams
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { businessSlug } = resolvedParams;
  const { start, end } = resolvedSearchParams;
  
  const supabase = await createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', businessSlug)
    .single();

  if (!business) notFound();

  let start_date = start;
  let end_date = end;
  if (!start_date || !end_date) {
    const today = new Date();
    start_date = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    end_date = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  // Fetch sales for period
  const { data: sales, error } = await supabase
    .from('sales')
    .select('id, sale_number, effective_date, total_minor, payment_status, refund_status')
    .eq('business_id', business.id)
    .gte('effective_date', start_date)
    .lte('effective_date', end_date)
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
          <h2 className="text-xl font-bold text-white">Sales & Revenue</h2>
          <p className="text-sm text-white/60">Detail view of all sales within the selected period.</p>
        </div>
        <div className="flex gap-4">
          <a 
            href={`/api/v1/reports/export?type=sales&start=${start_date}&end=${end_date}&businessId=${business.id}`}
            className="bg-[#B8F25C] text-[#0A1A12] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#B8F25C]/90"
          >
            Export CSV
          </a>
          <PeriodSelector />
        </div>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Sale Number</th>
                <th className="px-6 py-3 font-semibold text-right">Total</th>
                <th className="px-6 py-3 font-semibold text-center">Payment</th>
                <th className="px-6 py-3 font-semibold text-center">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sales?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                    No sales found for this period.
                  </td>
                </tr>
              )}
              {sales?.map((s) => (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">{new Date(s.effective_date).toLocaleDateString('en-US')}</td>
                  <td className="px-6 py-4">{s.sale_number}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatMoney(s.total_minor)}</td>
                  <td className="px-6 py-4 text-center capitalize">{s.payment_status.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-center capitalize">
                    {s.refund_status !== 'none' ? <span className="text-orange-400">{s.refund_status}</span> : '-'}
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
