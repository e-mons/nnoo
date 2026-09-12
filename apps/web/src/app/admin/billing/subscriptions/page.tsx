import { createClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';

export default async function AdminSubscriptionsPage() {
  await requireServerAdmin();
  const supabase = await createClient();

  // Simple server pagination would use query params, skipping for standard list scope
  const { data: subscriptions } = await supabase.from('business_subscriptions').select(`
    id,
    provider_environment,
    provider_subscription_code,
    normalized_status,
    next_payment_at,
    businesses ( id, name ),
    billing_plans ( id, name, code )
  `).order('created_at', { ascending: false }).limit(50);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Subscriptions</h1>
          <p className="text-gray-400 mt-1">Manage Business SaaS subscriptions.</p>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-[#2a302c] mb-8">
        <Link href="/admin/billing" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Overview</Link>
        <Link href="/admin/billing/plans" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Plans</Link>
        <Link href="/admin/billing/subscriptions" className="px-4 py-2 border-b-2 border-emerald-500 text-white font-medium">Subscriptions</Link>
        <Link href="/admin/billing/payments" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Payments</Link>
        <Link href="/admin/billing/failures" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Failures</Link>
      </div>

      <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-[#2a302c]">
          <thead className="bg-[#141816]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Business</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Env</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a302c]">
            {subscriptions?.map((sub) => (
              <tr key={sub.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{sub.businesses?.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{sub.businesses?.id.split('-')[0]}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{sub.billing_plans?.name}</div>
                  <div className="text-xs text-gray-500">{sub.provider_subscription_code || 'Pending Checkout'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-mono ${sub.provider_environment === 'live' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                    {sub.provider_environment}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${sub.normalized_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                    ${sub.normalized_status === 'past_due' ? 'bg-red-500/10 text-red-400' : ''}
                    ${sub.normalized_status === 'non_renewing' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                    ${['pending', 'cancelled', 'inactive'].includes(sub.normalized_status) ? 'bg-gray-500/10 text-gray-400' : ''}
                  `}>
                    {sub.normalized_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  <Link href={`/admin/billing/subscriptions/${sub.id}`} className="text-emerald-500 hover:text-emerald-400 font-medium">
                    Inspect &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {subscriptions?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No subscriptions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
