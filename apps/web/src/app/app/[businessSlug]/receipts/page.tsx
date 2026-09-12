import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ReceiptsPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessSlug)
    .single();

  if (!business) {
    notFound();
  }

  const { data: receipts } = await supabase
    .from('receipts')
    .select(`
      id,
      receipt_number,
      amount_minor,
      currency_code,
      payment_occurred_at,
      payment_method_snapshot,
      customer_snapshot,
      sale_number_snapshot
    `)
    .eq('business_id', business.id)
    .order('payment_occurred_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Receipts</h1>
          <p className="text-white/60">View all customer payment receipts</p>
        </div>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest">Receipt #</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest">Customer</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest">Reference Sale</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest text-right">Amount</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-widest">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {receipts?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/50">
                  No receipts found. Record a payment to generate one.
                </td>
              </tr>
            )}
            {receipts?.map((receipt) => {
              const customer = receipt.customer_snapshot as { name: string } | null;
              return (
                <tr key={receipt.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="p-4">
                    <Link href={`/app/${businessSlug}/receipts/${receipt.id}`} className="block">
                      <span className="font-medium text-white group-hover:text-[#B8F25C] transition-colors">
                        {receipt.receipt_number}
                      </span>
                    </Link>
                  </td>
                  <td className="p-4 text-white/80">
                    {customer?.name || 'Walk-in'}
                  </td>
                  <td className="p-4 text-white/60">
                    {receipt.sale_number_snapshot}
                  </td>
                  <td className="p-4 text-right text-[#B8F25C] font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: receipt.currency_code
                    }).format(receipt.amount_minor / 100)}
                  </td>
                  <td className="p-4 text-sm text-white/60">
                    {new Date(receipt.payment_occurred_at).toLocaleDateString('en-US')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
