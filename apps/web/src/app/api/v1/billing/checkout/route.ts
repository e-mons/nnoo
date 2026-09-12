import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initializeCheckoutParamsSchema } from '@nnoo/validation';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = initializeCheckoutParamsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid checkout parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify business membership & role
    const { data: membership, error: membershipError } = await supabase
      .from('business_memberships')
      .select('role')
      .eq('business_id', parsed.data.businessId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (membership.role !== 'owner' && membership.role !== 'business_admin') {
      return NextResponse.json(
        { error: 'Only business owners and admins can manage billing' },
        { status: 403 }
      );
    }

    // 3. Resolve Internal Plan & Mapping
    const { data: planMapping, error: planError } = await supabase
      .from('billing_plan_provider_mappings')
      .select('provider_plan_code, provider_environment, billing_plans ( id, code, amount_minor )')
      .eq('provider', 'paystack')
      .eq('billing_plans.code', parsed.data.planCode)
      .single();

    if (planError || !planMapping) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const internalPlan = planMapping.billing_plans as any;
    if (!internalPlan || !internalPlan.amount_minor) {
      return NextResponse.json({ error: 'Plan details not found' }, { status: 404 });
    }

    // 4. Resolve Billing Email
    let billingEmail = user.email;
    const { data: existingCustomer } = await supabase
      .from('business_billing_customers')
      .select('billing_email')
      .eq('business_id', parsed.data.businessId)
      .eq('provider_environment', planMapping.provider_environment)
      .maybeSingle();

    if (existingCustomer?.billing_email) {
      billingEmail = existingCustomer.billing_email;
    }

    // 5. Generate Reference
    const reference = `sub_${parsed.data.businessId.replace(/-/g, '').substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 6. Initialize Paystack Transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: billingEmail,
        amount: internalPlan.amount_minor,
        reference,
        plan: planMapping.provider_plan_code,
        metadata: {
          business_id: parsed.data.businessId,
          internal_plan_id: internalPlan.id,
          environment: planMapping.provider_environment,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Paystack Initialization Failed:', errText);
      return NextResponse.json(
        { error: 'Payment provider initialization failed' },
        { status: 502 }
      );
    }

    const paystackData = await response.json();
    if (!paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || 'Initialization failed' },
        { status: 400 }
      );
    }

    // 7. Persist Pending Transaction
    const { error: insertError } = await supabase.from('billing_transactions').insert({
      business_id: parsed.data.businessId,
      billing_plan_id: internalPlan.id,
      provider: 'paystack',
      provider_environment: planMapping.provider_environment,
      provider_reference: reference,
      transaction_type: 'initial_subscription',
      amount_minor: internalPlan.amount_minor,
      currency_code: 'NGN',
      normalized_status: 'pending',
    });

    if (insertError) {
      console.error('Failed to insert billing transaction:', insertError);
    }

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference,
    });
  } catch (err: any) {
    console.error('Checkout API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
