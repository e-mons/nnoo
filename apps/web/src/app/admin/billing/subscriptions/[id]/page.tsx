import { createClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BillingOverrideActions } from './BillingOverrideActions';

export default async function AdminSubscriptionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requireServerAdmin();
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data: sub } = await supabase.from('business_subscriptions').select(`
    *,
    businesses ( id, name ),
    billing_plans ( id, name, code, amount_minor, currency_code )
  `).eq('id', resolvedParams.id).single();

  if (!sub) notFound();

  // Load Active Overrides
  const { data: overrides } = await supabase.from('business_billing_access_overrides')
    .select('*')
    .eq('business_id', sub.business_id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  // Load recent transactions
  const { data: transactions } = await supabase.from('billing_transactions')
    .select('*')
    .eq('business_subscription_id', sub.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="mb-8">
        <Link href="/admin/billing/subscriptions" className="text-sm font-medium text-emerald-500 hover:text-emerald-400">
          &larr; Back to Subscriptions
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-white tracking-tight">Inspect Subscription</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core Subscription Identity */}
        <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl p-6 shadow-xl space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-[#2a302c] pb-4">Subscription Record</h2>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Business</p>
            <div className="flex items-center justify-between">
              <p className="text-base text-white font-medium">{sub.businesses?.name}</p>
              <Link href={`/admin/businesses/${sub.business_id}`} className="text-sm text-emerald-500">View Business</Link>
            </div>
            <p className="text-xs text-gray-600 font-mono mt-1">{sub.business_id}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Billing Plan</p>
            <p className="text-base text-white font-medium">{sub.billing_plans?.name}</p>
            <p className="text-xs text-gray-600 font-mono mt-1">{sub.billing_plans?.code}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <p className="text-base font-semibold capitalize text-emerald-400">{sub.normalized_status.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Environment</p>
              <p className="text-base text-white uppercase font-mono">{sub.provider_environment}</p>
            </div>
          </div>
        </div>

        {/* Provider Sync / Access Inspector */}
        <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl p-6 shadow-xl space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-[#2a302c] pb-4">Provider Truth & Access</h2>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Paystack Subscription Code</p>
            <p className="text-base text-white font-mono">{sub.provider_subscription_code || 'None'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Next Payment At</p>
              <p className="text-sm text-white">
                {sub.next_payment_at ? new Date(sub.next_payment_at).toLocaleDateString('en-US') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Cancel At Period End?</p>
              <p className="text-sm text-white">{sub.cancel_at_period_end ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="bg-[#0f1211] p-4 rounded-lg border border-[#2a302c]">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Effective Billing Access</p>
            {overrides && overrides.length > 0 ? (
              <p className="text-sm font-semibold text-blue-400">ALLOWED VIA OVERRIDE ({overrides[0].override_type})</p>
            ) : sub.normalized_status === 'active' || sub.normalized_status === 'non_renewing' ? (
              <p className="text-sm font-semibold text-emerald-400">ACTIVE SUBSCRIPTION</p>
            ) : (
              <p className="text-sm font-semibold text-red-400">BILLING REQUIRED</p>
            )}
          </div>

          <BillingOverrideActions businessId={sub.business_id} activeOverrides={overrides || []} />
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl p-6 shadow-xl space-y-6">
        <h2 className="text-xl font-semibold text-white border-b border-[#2a302c] pb-4">Recent Transactions</h2>
        <div className="space-y-4">
          {transactions?.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 bg-[#0f1211] rounded-lg border border-[#2a302c]">
              <div>
                <p className="text-sm text-white font-medium capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                <p className="text-xs text-gray-500 font-mono mt-1">{tx.provider_reference}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white font-semibold">
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: tx.currency_code }).format(tx.amount_minor / 100)}
                </p>
                <p className={`text-xs mt-1 capitalize font-medium ${tx.normalized_status === 'success' ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {tx.normalized_status}
                </p>
              </div>
            </div>
          ))}
          {transactions?.length === 0 && <p className="text-sm text-gray-500">No transactions recorded.</p>}
        </div>
      </div>
    </div>
  );
}
