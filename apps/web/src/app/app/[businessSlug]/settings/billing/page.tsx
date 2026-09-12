import { getActiveSubscription, getBillingPlans } from '@/lib/actions/billing';
import SubscribeButton from '@/components/billing/SubscribeButton';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function BillingSettingsPage({
  params
}: {
  params: Promise<{ businessSlug: string }>
}) {
  const { businessSlug } = await params;
  
  const supabase = await createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', businessSlug) // Slug is ID in our simple route structure
    .single();

  if (!business) {
    notFound();
  }

  const subscription = await getActiveSubscription(business.id);
  const plans = await getBillingPlans();

  const formatMoney = (amountMinor: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amountMinor / 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Billing & Subscription
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage your platform subscription and billing details for {business.name}.
        </p>
      </div>

      {subscription ? (
        <div className="bg-[#1a1f1c] border border-[#2a302c] shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-white">Current Subscription</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-400">
              <p>You are currently on the <span className="font-semibold text-emerald-400">{subscription.billing_plans?.name}</span> plan.</p>
              <p className="mt-1">
                Status: <span className="capitalize text-white">{subscription.normalized_status}</span>
              </p>
              {subscription.next_payment_at && (
                <p className="mt-1">
                  Next payment: {new Date(subscription.next_payment_at).toLocaleDateString('en-US')}
                </p>
              )}
            </div>
            <div className="mt-5">
              {subscription.normalized_status === 'active' ? (
                <button
                  disabled
                  className="inline-flex items-center rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-700"
                >
                  Manage on Paystack
                </button>
              ) : (
                <div className="text-red-400 text-sm">
                  Your subscription requires attention. Please renew below.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1f1c] border border-[#2a302c] shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-white">No Active Subscription</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-400">
              <p>You currently don't have an active subscription for this business.</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold leading-6 text-white mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-[#141816] rounded-2xl border border-[#2a302c] p-8 flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="text-lg font-semibold leading-8 text-white">{plan.name}</h3>
                <p className="mt-4 text-sm leading-6 text-gray-400">{plan.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-white">
                    {formatMoney(plan.amount_minor, plan.currency_code)}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-gray-400">/{plan.billing_interval}</span>
                </p>
              </div>
              <SubscribeButton 
                businessId={business.id} 
                planCode={plan.code} 
                price={plan.amount_minor} 
                buttonText={subscription?.billing_plan_id === plan.id ? "Renew Plan" : "Subscribe"} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
