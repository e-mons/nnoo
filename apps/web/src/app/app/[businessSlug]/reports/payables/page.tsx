import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function PayablesReportPage({
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

  // Fetch unpaid expenses (Accounts Payable)
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('id, expense_number, effective_date, total_minor, payment_status, suppliers(name)')
    .eq('business_id', business.id)
    .neq('payment_status', 'paid')
    .gt('total_minor', 0)
    .order('effective_date', { ascending: false });

  if (expensesError) {
    console.error(expensesError);
  }

  // Fetch unpaid stock receipts (Accounts Payable)
  const { data: receipts, error: receiptsError } = await supabase
    .from('stock_receipts')
    .select('id, receipt_number, effective_date, total_minor, payment_status, suppliers(name)')
    .eq('business_id', business.id)
    .neq('payment_status', 'paid')
    .gt('total_minor', 0)
    .order('effective_date', { ascending: false });

  if (receiptsError) {
    console.error(receiptsError);
  }

  const formatMoney = (minor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: business.currency_code
    }).format(minor / 100);
  };

  const payables = [
    ...(expenses || []).map((e: any) => ({ ...e, type: 'Expense', number: e.expense_number })),
    ...(receipts || []).map((r: any) => ({ ...r, type: 'Stock Receipt', number: r.receipt_number }))
  ].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Accounts Payable</h2>
          <p className="text-sm text-white/60">Outstanding balances owed to suppliers for expenses and stock receipts.</p>
        </div>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Document Number</th>
                <th className="px-6 py-3 font-semibold">Supplier</th>
                <th className="px-6 py-3 font-semibold text-right">Total Amount</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {payables.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/50">
                    No outstanding payables found.
                  </td>
                </tr>
              )}
              {payables.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">{new Date(p.effective_date).toLocaleDateString('en-US')}</td>
                  <td className="px-6 py-4 text-white/70">{p.type}</td>
                  <td className="px-6 py-4">
                    <Link 
                      href={`/app/${businessSlug}/${p.type === 'Expense' ? 'expenses' : 'receipts'}/${p.id}`} 
                      className="hover:underline font-medium"
                    >
                      {p.number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{p.suppliers?.name || 'Unknown Supplier'}</td>
                  <td className="px-6 py-4 text-right font-medium text-orange-400">{formatMoney(p.total_minor)}</td>
                  <td className="px-6 py-4 text-center capitalize">
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-md text-xs font-medium border border-orange-500/30">
                      {p.payment_status.replace('_', ' ')}
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
