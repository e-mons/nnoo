import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import Link from 'next/link';

export default async function ExpensesReportPage({
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

  // Fetch expenses for period
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('id, expense_number, effective_date, total_minor, payment_status, expense_categories(name)')
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
          <h2 className="text-xl font-bold text-white">Operating Expenses</h2>
          <p className="text-sm text-white/60">Detail view of all expenses within the selected period.</p>
        </div>
        <div className="flex gap-4">
          <PeriodSelector />
        </div>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Expense Number</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold text-right">Total</th>
                <th className="px-6 py-3 font-semibold text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {expenses?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                    No expenses found for this period.
                  </td>
                </tr>
              )}
              {expenses?.map((e: any) => (
                <tr key={e.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">{new Date(e.effective_date).toLocaleDateString('en-US')}</td>
                  <td className="px-6 py-4">
                    <Link href={`/app/${businessSlug}/expenses/${e.id}`} className="hover:underline">
                      {e.expense_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{e.expense_categories?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatMoney(e.total_minor)}</td>
                  <td className="px-6 py-4 text-center capitalize">{e.payment_status.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
