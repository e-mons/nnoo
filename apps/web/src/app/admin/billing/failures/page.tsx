import { createClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';

export default async function AdminFailuresPage() {
  await requireServerAdmin();
  const supabase = await createClient();

  // Fetch only subscriptions needing attention
  const { data: subscriptions } = await supabase.from('business_subscriptions').select(`
    id,
    normalized_status,
    provider_environment,
    provider_subscription_code,
    businesses ( name ),
    billing_plans ( name )
  `).in('normalized_status', ['past_due', 'non_renewing'])
    .order('updated_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Attention Needed</h1>
          <p className="text-gray-400 mt-1">Queue of failed renewals and non-renewing subscriptions.</p>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-[#2a302c] mb-8">
        <Link href="/admin/billing" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Overview</Link>
        <Link href="/admin/billing/plans" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Plans</Link>
        <Link href="/admin/billing/subscriptions" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Subscriptions</Link>
        <Link href="/admin/billing/payments" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Payments</Link>
        <Link href="/admin/billing/failures" className="px-4 py-2 border-b-2 border-emerald-500 text-white font-medium">Failures</Link>
      </div>

      <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-[#2a302c]">
          <thead className="bg-[#141816]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Business</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Failure State</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a302c]">
            {subscriptions?.map((sub) => (
              <tr key={sub.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{sub.businesses?.name}</div>
                  <div className="text-xs text-gray-500">{sub.provider_subscription_code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{sub.billing_plans?.name}</div>
                  <div className="text-xs text-gray-500">{sub.provider_environment}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${sub.normalized_status === 'past_due' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}
                  `}>
                    {sub.normalized_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link href={`/admin/billing/subscriptions/${sub.id}`} className="text-emerald-500 hover:text-emerald-400 font-medium">
                    Inspect &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {subscriptions?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No subscriptions currently require attention.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
