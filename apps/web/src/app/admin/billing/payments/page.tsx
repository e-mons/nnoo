import { createClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';

export default async function AdminPaymentsPage() {
  await requireServerAdmin();
  const supabase = await createClient();

  // Fetch transactions ordered by most recent, with their business and plan
  const { data: transactions } = await supabase.from('billing_transactions').select(`
    *,
    businesses ( name ),
    billing_plans ( name, code )
  `).order('created_at', { ascending: false }).limit(100);

  const formatMoney = (amountMinor: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amountMinor / 100);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Payments</h1>
          <p className="text-gray-400 mt-1">Immutable log of provider transactions.</p>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-[#2a302c] mb-8">
        <Link href="/admin/billing" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Overview</Link>
        <Link href="/admin/billing/plans" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Plans</Link>
        <Link href="/admin/billing/subscriptions" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Subscriptions</Link>
        <Link href="/admin/billing/payments" className="px-4 py-2 border-b-2 border-emerald-500 text-white font-medium">Payments</Link>
        <Link href="/admin/billing/failures" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Failures</Link>
      </div>

      <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-[#2a302c]">
          <thead className="bg-[#141816]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Business</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type & Reference</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a302c]">
            {transactions?.map((tx) => (
              <tr key={tx.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{new Date(tx.created_at).toLocaleDateString('en-US')}</div>
                  <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleTimeString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{tx.businesses?.name}</div>
                  <div className="text-xs text-gray-500">{tx.billing_plans?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300 capitalize">{tx.transaction_type.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-500 font-mono">{tx.provider_reference}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{formatMoney(tx.amount_minor, tx.currency_code)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${tx.normalized_status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                    ${tx.normalized_status === 'failed' ? 'bg-red-500/10 text-red-400' : ''}
                    ${['pending', 'abandoned'].includes(tx.normalized_status) ? 'bg-gray-500/10 text-gray-400' : ''}
                  `}>
                    {tx.normalized_status}
                  </span>
                </td>
              </tr>
            ))}
            {transactions?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
