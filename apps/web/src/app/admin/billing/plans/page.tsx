import { createClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';
import { PlanStatusToggle } from './PlanStatusToggle';

export default async function AdminBillingPlansPage() {
  await requireServerAdmin();
  const supabase = await createClient();

  const { data: plans } = await supabase.from('billing_plans').select(`
    *,
    billing_plan_provider_mappings (
      provider,
      provider_environment,
      provider_plan_code,
      is_active
    )
  `).order('sort_order', { ascending: true });

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
          <h1 className="text-3xl font-bold text-white tracking-tight">Billing Plans</h1>
          <p className="text-gray-400 mt-1">Manage internal NNOO SaaS plans and provider mappings.</p>
        </div>
        <Link href="/admin/billing/plans/new" className="bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-emerald-500">
          Create Plan
        </Link>
      </div>

      <div className="flex space-x-4 border-b border-[#2a302c] mb-8">
        <Link href="/admin/billing" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Overview</Link>
        <Link href="/admin/billing/plans" className="px-4 py-2 border-b-2 border-emerald-500 text-white font-medium">Plans</Link>
        <Link href="/admin/billing/subscriptions" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Subscriptions</Link>
        <Link href="/admin/billing/payments" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Payments</Link>
        <Link href="/admin/billing/failures" className="px-4 py-2 text-gray-400 hover:text-white font-medium">Failures</Link>
      </div>

      <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-[#2a302c]">
          <thead className="bg-[#141816]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan Name & Code</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price / Interval</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Provider Mapping</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a302c]">
            {plans?.map((plan) => (
              <tr key={plan.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{plan.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{plan.code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{formatMoney(plan.amount_minor, plan.currency_code)}</div>
                  <div className="text-xs text-gray-500 capitalize">{plan.billing_interval}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PlanStatusToggle planId={plan.id} isActive={plan.is_active} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {plan.billing_plan_provider_mappings && plan.billing_plan_provider_mappings.length > 0 ? (
                    <div className="space-y-1">
                      {plan.billing_plan_provider_mappings.map((mapping: any, idx: number) => (
                        <div key={idx} className="flex items-center text-xs space-x-2">
                          <span className={`px-1.5 py-0.5 rounded font-mono ${mapping.provider_environment === 'live' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
                            {mapping.provider_environment}
                          </span>
                          <span className="text-gray-400">{mapping.provider_plan_code}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-yellow-500">Unmapped</span>
                  )}
                </td>
              </tr>
            ))}
            {plans?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No plans found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
