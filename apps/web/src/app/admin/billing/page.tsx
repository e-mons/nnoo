import { createClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';
import { CreditCard, ArrowRight, Activity } from 'lucide-react';

export default async function AdminBillingOverview() {
  await requireServerAdmin();
  const supabase = await createClient();

  // Basic stats & transactions
  const [
    { count: activeSubs },
    { count: pastDueSubs },
    { count: nonRenewingSubs },
    { count: cancelledSubs },
    { data: successfulTxs },
    { data: recentTxs },
  ] = await Promise.all([
    supabase.from('business_subscriptions').select('*', { count: 'exact', head: true }).eq('normalized_status', 'active'),
    supabase.from('business_subscriptions').select('*', { count: 'exact', head: true }).eq('normalized_status', 'past_due'),
    supabase.from('business_subscriptions').select('*', { count: 'exact', head: true }).eq('normalized_status', 'non_renewing'),
    supabase.from('business_subscriptions').select('*', { count: 'exact', head: true }).eq('normalized_status', 'cancelled'),
    supabase.from('billing_transactions').select('amount_minor, currency_code').eq('normalized_status', 'success'),
    supabase.from('billing_transactions').select(`
      id,
      amount_minor,
      currency_code,
      transaction_type,
      normalized_status,
      created_at,
      businesses ( id, name )
    `).order('created_at', { ascending: false }).limit(5),
  ]);

  const formatCount = (val: number | null) => val !== null ? val : 0;

  // Calculate total revenue
  let totalRevenueMinor = 0;
  for (const tx of successfulTxs || []) {
    totalRevenueMinor += tx.amount_minor || 0;
  }

  const formatMoney = (amountMinor: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amountMinor / 100);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-[#B8F25C]" /> Platform Billing
          </h1>
          <p className="text-gray-400 mt-1">Overview of SaaS subscriptions, revenue, and Paystack transactions.</p>
        </div>
      </div>

      {/* Nav Sub-Tabs */}
      <div className="flex space-x-4 border-b border-[#2a302c]">
        <Link href="/admin/billing" className="px-4 py-2 border-b-2 border-emerald-500 text-white font-medium">Overview</Link>
        <Link href="/admin/billing/plans" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Plans</Link>
        <Link href="/admin/billing/subscriptions" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Subscriptions</Link>
        <Link href="/admin/billing/payments" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Payments</Link>
        <Link href="/admin/billing/failures" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Failures</Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl p-5">
          <p className="text-xs font-medium text-gray-400 uppercase">Processed Revenue</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{formatMoney(totalRevenueMinor)}</p>
          <p className="text-xs text-gray-500 mt-1">{successfulTxs?.length || 0} successful charges</p>
        </div>
        <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl p-5">
          <p className="text-xs font-medium text-gray-400 uppercase">Active Subscriptions</p>
          <p className="text-2xl font-bold text-white mt-2">{formatCount(activeSubs)}</p>
          <p className="text-xs text-gray-500 mt-1">Healthy recurring</p>
        </div>
        <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl p-5">
          <p className="text-xs font-medium text-gray-400 uppercase">Past Due Subscriptions</p>
          <p className="text-2xl font-bold text-red-400 mt-2">{formatCount(pastDueSubs)}</p>
          <p className="text-xs text-gray-500 mt-1">Attention required</p>
        </div>
        <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl p-5">
          <p className="text-xs font-medium text-gray-400 uppercase">Non-Renewing</p>
          <p className="text-2xl font-bold text-amber-400 mt-2">{formatCount(nonRenewingSubs)}</p>
          <p className="text-xs text-gray-500 mt-1">Cancelling at period end</p>
        </div>
        <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl p-5">
          <p className="text-xs font-medium text-gray-400 uppercase">Cancelled / Inactive</p>
          <p className="text-2xl font-bold text-gray-400 mt-2">{formatCount(cancelledSubs)}</p>
          <p className="text-xs text-gray-500 mt-1">No active renewal</p>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[#2a302c] flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#B8F25C]" /> Recent Billing Transactions
          </h2>
          <Link href="/admin/billing/payments" className="text-xs text-[#B8F25C] hover:underline flex items-center gap-1 font-medium">
            View All Payments <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2a302c] text-xs">
            <thead className="bg-[#141816] text-gray-400 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Business</th>
                <th className="px-5 py-3 text-left">Transaction Type</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a302c] text-gray-300">
              {recentTxs && recentTxs.length > 0 ? (
                recentTxs.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="px-5 py-3 text-gray-400 font-mono">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-white font-medium">
                      {tx.businesses?.name || 'Unknown Business'}
                    </td>
                    <td className="px-5 py-3 capitalize">
                      {tx.transaction_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3 text-white font-semibold">
                      {formatMoney(tx.amount_minor, tx.currency_code)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                        tx.normalized_status === 'success'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : tx.normalized_status === 'failed'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {tx.normalized_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-gray-500">
                    No billing transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
