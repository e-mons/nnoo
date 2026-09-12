'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  InitializeCheckoutParams, 
  CheckoutResponse,
  VerifyCallbackParams
} from '@nnoo/contracts';
import { initializeCheckoutParamsSchema, verifyCallbackParamsSchema } from '@nnoo/validation';
import { getServerConfig, assertPaystackEnvironment } from '@/server/config';

export async function initializeSubscriptionCheckout(params: InitializeCheckoutParams): Promise<CheckoutResponse> {
  const parsed = initializeCheckoutParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error('Invalid input');
  }

  const config = getServerConfig();
  if (!config.PAYSTACK_SECRET_KEY) {
    throw new Error('Billing provider is not configured in this environment');
  }
  const envCheck = assertPaystackEnvironment(config.NNOO_ENV, config.PAYSTACK_SECRET_KEY, config.PAYSTACK_ENVIRONMENT);
  if (!envCheck.valid) {
    throw new Error(`Billing configuration error: ${envCheck.error}`);
  }
  const paystackSecretKey = config.PAYSTACK_SECRET_KEY;

  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  // 2. Verify business membership & role (Owner/Admin required)
  const { data: membership, error: membershipError } = await supabase
    .from('business_memberships')
    .select('role')
    .eq('business_id', params.businessId)
    .eq('user_id', user.id)
    .eq('membership_status', 'active')
    .single();

  if (membershipError || !membership) throw new Error('Forbidden');
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new Error('Only owners and admins can manage billing');
  }

  // 3. Resolve Internal Plan & Mapping
  const { data: planMapping, error: planError } = await supabase
    .from('billing_plan_provider_mappings')
    .select('provider_plan_code, provider_environment, billing_plans ( id, code, amount_minor )')
    .eq('provider', 'paystack')
    .eq('billing_plans.code', params.planCode)
    .single();

  if (planError || !planMapping) throw new Error('Invalid plan selected');

  // Ensure this returns the internal plan correctly
  // Type assertion because Supabase joined data typing can be quirky
  const internalPlan = planMapping.billing_plans as any; 
  if (!internalPlan || !internalPlan.amount_minor) throw new Error('Plan details not found');

  // 4. Resolve Billing Email (if no customer mapped yet, use current user email)
  let billingEmail = user.email;
  const { data: existingCustomer } = await supabase
    .from('business_billing_customers')
    .select('billing_email, provider_customer_code')
    .eq('business_id', params.businessId)
    .eq('provider_environment', planMapping.provider_environment)
    .maybeSingle();

  if (existingCustomer) {
    billingEmail = existingCustomer.billing_email;
  }

  // 5. Generate Reference
  const reference = `sub_${params.businessId.replace(/-/g, '').substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 6. Initialize Paystack Transaction
  // Notice we pass the provider_plan_code! Paystack will handle the recurring billing.
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: billingEmail,
      amount: internalPlan.amount_minor, // Must match the plan's exact amount
      reference,
      plan: planMapping.provider_plan_code,
      metadata: {
        business_id: params.businessId,
        internal_plan_id: internalPlan.id,
        environment: planMapping.provider_environment
      }
    })
  });

  if (!response.ok) {
    console.error('Paystack Initialization Failed', await response.text());
    throw new Error('Payment provider initialization failed');
  }

  const paystackData = await response.json();
  if (!paystackData.status) {
    throw new Error(paystackData.message || 'Initialization failed');
  }

  // 7. Persist Pending Transaction
  const { error: insertError } = await supabase
    .from('billing_transactions')
    .insert({
      business_id: params.businessId,
      billing_plan_id: internalPlan.id,
      provider: 'paystack',
      provider_environment: planMapping.provider_environment,
      provider_reference: reference,
      transaction_type: 'initial_subscription',
      amount_minor: internalPlan.amount_minor,
      currency_code: 'NGN',
      normalized_status: 'pending'
    });

  if (insertError) {
    console.error(insertError);
    throw new Error('Failed to create internal billing transaction');
  }

  return {
    authorizationUrl: paystackData.data.authorization_url,
    reference
  };
}

export async function verifySubscriptionCallback(params: VerifyCallbackParams): Promise<void> {
  const parsed = verifyCallbackParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error('Invalid input');
  }

  const supabase = await createClient();
  
  // Auth checks
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const { data: membership } = await supabase
    .from('business_memberships')
    .select('role')
    .eq('business_id', params.businessId)
    .eq('user_id', user.id)
    .single();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    throw new Error('Forbidden');
  }

  // Verify Paystack
  const config = getServerConfig();
  if (!config.PAYSTACK_SECRET_KEY) {
    throw new Error('Billing provider is not configured');
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${params.reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`
    }
  });

  const paystackData = await response.json();
  if (!response.ok || !paystackData.status) {
    // Optionally update transaction to failed
    await supabase.from('billing_transactions')
      .update({ normalized_status: 'failed', provider_status: paystackData.data?.status || 'error' })
      .eq('provider_reference', params.reference);

    throw new Error('Transaction verification failed');
  }

  const txData = paystackData.data;

  // Transaction succeeded, but is it already verified?
  const { data: existingTx } = await supabase
    .from('billing_transactions')
    .select('id, normalized_status, billing_plan_id, provider_environment')
    .eq('provider_reference', params.reference)
    .single();

  if (!existingTx) throw new Error('Transaction not found in internal records');
  if (existingTx.normalized_status === 'success') {
    return; // Already processed idempotently
  }

  if (txData.status !== 'success') {
    throw new Error('Transaction is not successful yet');
  }

  // Update transaction status
  await supabase.from('billing_transactions')
    .update({ 
      normalized_status: 'success', 
      provider_status: txData.status,
      provider_transaction_id: txData.id.toString(),
      paid_at: new Date(txData.paid_at).toISOString(),
      channel: txData.channel,
      provider_customer_code: txData.customer?.customer_code
    })
    .eq('id', existingTx.id);

  // If there's no business customer mapped, map it
  if (txData.customer?.customer_code) {
    await supabase.from('business_billing_customers').upsert({
      business_id: params.businessId,
      provider: 'paystack',
      provider_environment: existingTx.provider_environment,
      provider_customer_code: txData.customer.customer_code,
      billing_email: txData.customer.email
    }, { onConflict: 'business_id,provider,provider_environment' });
  }

  // We rely on Webhooks (subscription.create) for exact subscription ID mapping, 
  // but if the subscription code is returned immediately, we could map it. 
  // Normally Paystack sends it in the webhook.
}

export async function getActiveSubscription(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_subscriptions')
    .select(`
      *,
      billing_plans (
        name,
        code,
        amount_minor,
        billing_interval
      )
    `)
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    console.error('getActiveSubscription error:', error);
    return null;
  }
  return data;
}

export async function getBillingPlans() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('billing_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return data || [];
}
