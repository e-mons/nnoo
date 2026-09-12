import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@nnoo/supabase';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

// Create a service-role client for backend webhook processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const rawBody = await req.text();
    
    // Verify HMAC SHA512 signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.error('Paystack webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const data = event.data;
    
    // Use an event dedupe key (usually the event ID or hash + timestamp if none)
    const eventDedupeKey = data.id ? data.id.toString() : hash.substring(0, 32);

    // 1. Idempotency Check
    const { data: existingEvent, error: existingError } = await supabase
      .from('billing_webhook_events')
      .select('id')
      .eq('provider', 'paystack')
      .eq('provider_environment', 'test') // Hardcoded for this feature scope, production uses dynamic env
      .eq('event_dedupe_key', eventDedupeKey)
      .maybeSingle();

    if (existingEvent) {
      // Already processed or pending
      return NextResponse.json({ status: 'ignored', reason: 'duplicate' });
    }

    // Insert as pending
    const { data: webhookRecord, error: insertError } = await supabase
      .from('billing_webhook_events')
      .insert({
        provider: 'paystack',
        provider_environment: 'test',
        event_type: eventType,
        event_dedupe_key: eventDedupeKey,
        provider_reference: data.reference,
        provider_subscription_code: data.subscription_code,
        payload_hash: hash,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to log webhook', insertError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 2. Process Event
    try {
      if (eventType === 'subscription.create') {
        await handleSubscriptionCreate(data);
      } else if (eventType === 'charge.success') {
        await handleChargeSuccess(data);
      } else if (eventType === 'invoice.payment_failed') {
        await handlePaymentFailed(data);
      } else if (eventType === 'subscription.disable' || eventType === 'subscription.not_renew') {
        await handleSubscriptionDisable(data, eventType);
      }

      // Mark processed
      await supabase
        .from('billing_webhook_events')
        .update({ processing_status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', webhookRecord.id);

    } catch (processError: any) {
      console.error('Webhook processing error:', processError);
      await supabase
        .from('billing_webhook_events')
        .update({ processing_status: 'failed', failure_code: processError.message })
        .eq('id', webhookRecord.id);
      
      // We still return 200 to Paystack so it doesn't retry unnecessarily if it's a domain error
      // However, if it's a critical transient error, we could return 500. For now, 200.
    }

    return NextResponse.json({ status: 'success' });

  } catch (err) {
    console.error('Webhook endpoint error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSubscriptionCreate(data: any) {
  // We need to find the Business via the customer email or the related initial transaction
  const customerEmail = data.customer?.email;
  if (!customerEmail) throw new Error('No customer email');

  const { data: customerData } = await supabase
    .from('business_billing_customers')
    .select('business_id, provider_environment')
    .eq('billing_email', customerEmail)
    .eq('provider', 'paystack')
    .maybeSingle();

  if (!customerData) {
    console.log('No matching business for subscription.create', customerEmail);
    return;
  }

  const { data: planMapping } = await supabase
    .from('billing_plan_provider_mappings')
    .select('billing_plan_id')
    .eq('provider_plan_code', data.plan.plan_code)
    .maybeSingle();

  if (!planMapping) throw new Error('Unknown plan code ' + data.plan.plan_code);

  await supabase.from('business_subscriptions').upsert({
    business_id: customerData.business_id,
    billing_plan_id: planMapping.billing_plan_id,
    provider: 'paystack',
    provider_environment: customerData.provider_environment,
    provider_subscription_code: data.subscription_code,
    provider_customer_code: data.customer.customer_code,
    normalized_status: data.status === 'active' ? 'active' : 'pending',
    provider_status: data.status,
    next_payment_at: data.next_payment_date,
    activated_at: new Date(data.createdAt).toISOString(),
    cancel_at_period_end: false
  }, { onConflict: 'business_id,provider_environment' });
}

async function handleChargeSuccess(data: any) {
  const reference = data.reference;
  const { data: tx } = await supabase
    .from('billing_transactions')
    .select('id, business_id, normalized_status, provider_environment')
    .eq('provider_reference', reference)
    .maybeSingle();

  // If we already have the transaction (via verify callback), just ensure status is success
  if (tx) {
    if (tx.normalized_status !== 'success') {
      await supabase.from('billing_transactions')
        .update({
          normalized_status: 'success',
          provider_status: data.status,
          paid_at: data.paid_at ? new Date(data.paid_at).toISOString() : new Date().toISOString()
        })
        .eq('id', tx.id);
    }
  } else {
    // This could be a recurring charge! (Renewal)
    if (data.plan?.plan_code) {
       // Look up the business subscription
       const { data: sub } = await supabase
        .from('business_subscriptions')
        .select('id, business_id, billing_plan_id, provider_environment')
        .eq('provider_subscription_code', data.plan.subscription_code || data.subscription?.subscription_code)
        .maybeSingle();

       if (sub) {
         // Create renewal transaction
         await supabase.from('billing_transactions').insert({
           business_id: sub.business_id,
           business_subscription_id: sub.id,
           billing_plan_id: sub.billing_plan_id,
           provider: 'paystack',
           provider_environment: sub.provider_environment,
           provider_reference: reference,
           transaction_type: 'renewal',
           amount_minor: data.amount,
           currency_code: data.currency || 'NGN',
           normalized_status: 'success',
           provider_status: data.status,
           paid_at: data.paid_at ? new Date(data.paid_at).toISOString() : new Date().toISOString()
         });

         // Update subscription
         await supabase.from('business_subscriptions')
           .update({
             normalized_status: 'active',
             latest_successful_payment_at: new Date().toISOString()
           })
           .eq('id', sub.id);
       }
    }
  }
}

async function handlePaymentFailed(data: any) {
  const subCode = data.subscription?.subscription_code;
  if (!subCode) return;

  await supabase.from('business_subscriptions')
    .update({
      normalized_status: 'past_due',
      latest_failed_payment_at: new Date().toISOString()
    })
    .eq('provider_subscription_code', subCode);
}

async function handleSubscriptionDisable(data: any, eventType: string) {
  const subCode = data.subscription_code;
  if (!subCode) return;

  const normalizedStatus = eventType === 'subscription.disable' ? 'cancelled' : 'non_renewing';
  
  await supabase.from('business_subscriptions')
    .update({
      normalized_status: normalizedStatus,
      cancel_at_period_end: true,
      provider_status: data.status,
      cancelled_at: eventType === 'subscription.disable' ? new Date().toISOString() : null
    })
    .eq('provider_subscription_code', subCode);
}
