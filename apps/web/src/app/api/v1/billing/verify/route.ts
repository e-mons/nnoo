import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyCallbackParamsSchema } from '@nnoo/validation';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyCallbackParamsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid verification parameters', details: parsed.error.format() },
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

    // 2. Verify business membership
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

    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Payment gateway is not configured on this server' },
        { status: 500 }
      );
    }

    // 3. Verify with Paystack API
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${parsed.data.reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await response.json();
    if (!response.ok || !paystackData.status) {
      await supabase
        .from('billing_transactions')
        .update({
          normalized_status: 'failed',
          provider_status: paystackData.data?.status || 'error',
        })
        .eq('provider_reference', parsed.data.reference);

      return NextResponse.json(
        { error: 'Transaction verification failed with provider' },
        { status: 400 }
      );
    }

    const txData = paystackData.data;

    // 4. Fetch internal transaction record
    const { data: existingTx } = await supabase
      .from('billing_transactions')
      .select('id, normalized_status, billing_plan_id, provider_environment')
      .eq('provider_reference', parsed.data.reference)
      .single();

    if (!existingTx) {
      return NextResponse.json(
        { error: 'Transaction not found in internal records' },
        { status: 404 }
      );
    }

    if (txData.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment is not completed yet', providerStatus: txData.status },
        { status: 402 }
      );
    }

    // 5. Update transaction record
    await supabase
      .from('billing_transactions')
      .update({
        normalized_status: 'success',
        provider_status: txData.status,
        provider_transaction_id: txData.id.toString(),
        paid_at: new Date(txData.paid_at).toISOString(),
        channel: txData.channel,
        provider_customer_code: txData.customer?.customer_code,
      })
      .eq('id', existingTx.id);

    // 6. Map Customer if not mapped
    if (txData.customer?.customer_code) {
      await supabase
        .from('business_billing_customers')
        .upsert(
          {
            business_id: parsed.data.businessId,
            provider: 'paystack',
            provider_environment: existingTx.provider_environment,
            provider_customer_code: txData.customer.customer_code,
            billing_email: txData.customer.email,
          },
          { onConflict: 'business_id, provider, provider_environment' }
        );
    }

    // 7. Provision / Update Subscription Record
    const nextPaymentAt = new Date();
    nextPaymentAt.setMonth(nextPaymentAt.getMonth() + 1);

    await supabase
      .from('business_subscriptions')
      .upsert(
        {
          business_id: parsed.data.businessId,
          billing_plan_id: existingTx.billing_plan_id,
          normalized_status: 'active',
          provider_status: 'active',
          provider: 'paystack',
          provider_environment: existingTx.provider_environment,
          provider_subscription_code: txData.plan_object?.plan_code || txData.reference,
          next_payment_at: nextPaymentAt.toISOString(),
          current_period_start: new Date(txData.paid_at).toISOString(),
          current_period_end: nextPaymentAt.toISOString(),
        },
        { onConflict: 'business_id' }
      );

    return NextResponse.json({
      success: true,
      message: 'Subscription successfully activated and verified.',
    });
  } catch (err: any) {
    console.error('Verify API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
