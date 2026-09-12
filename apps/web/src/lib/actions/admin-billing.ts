'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createBillingPlanSchema, grantOverrideSchema } from '@nnoo/validation';

async function requirePlatformAdmin(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const adminClient = createAdminClient();
  const { data: adminRecord, error: adminError } = await adminClient
    .from('platform_admins')
    .select('id, role, status')
    .eq('user_id', user.id)
    .single();

  if (adminError || !adminRecord || adminRecord.status !== 'active') {
    throw new Error('Forbidden: Requires active Platform Admin');
  }

  return adminRecord;
}

export async function createBillingPlan(params: {
  code: string;
  name: string;
  description?: string;
  amountMinor: number;
  currencyCode?: string;
  billingInterval: 'monthly' | 'annual';
}) {
  const parsed = createBillingPlanSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(`Invalid plan data: ${parsed.error.errors[0]?.message}`);
  }

  const supabase = await createClient();
  const admin = await requirePlatformAdmin(supabase);

  const { data, error } = await supabase.from('billing_plans').insert({
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description,
    amount_minor: parsed.data.amountMinor,
    currency_code: parsed.data.currencyCode || 'NGN',
    billing_interval: parsed.data.billingInterval,
    is_active: true,
  }).select().single();

  if (error) {
    console.error('createBillingPlan error:', error);
    throw new Error('Failed to create billing plan');
  }

  await supabase.from('platform_audit_events').insert({
    actor_id: admin.id,
    action: 'create_billing_plan',
    target_type: 'billing_plans',
    target_id: data.id,
    reason: 'Admin plan creation',
    metadata: { code: data.code, amount: data.amount_minor },
  });

  return data;
}

export async function deactivateBillingPlan(planId: string) {
  const supabase = await createClient();
  const admin = await requirePlatformAdmin(supabase);

  const { error } = await supabase.from('billing_plans').update({ is_active: false }).eq('id', planId);
  if (error) throw new Error('Failed to deactivate plan');

  await supabase.from('platform_audit_events').insert({
    actor_id: admin.id,
    action: 'deactivate_billing_plan',
    target_type: 'billing_plans',
    target_id: planId,
    reason: 'Admin plan deactivation',
    metadata: {}
  });
}

export async function activateBillingPlan(planId: string) {
  const supabase = await createClient();
  const admin = await requirePlatformAdmin(supabase);

  const { error } = await supabase.from('billing_plans').update({ is_active: true }).eq('id', planId);
  if (error) throw new Error('Failed to activate plan');

  await supabase.from('platform_audit_events').insert({
    actor_id: admin.id,
    action: 'activate_billing_plan',
    target_type: 'billing_plans',
    target_id: planId,
    reason: 'Admin plan activation',
    metadata: {}
  });
}

export async function grantBillingAccessOverride(overrideData: {
  businessId: string;
  overrideType: string;
  endsAt?: string;
  reason: string;
}) {
  const parsed = grantOverrideSchema.safeParse(overrideData);
  if (!parsed.success) throw new Error('Invalid override data');

  const supabase = await createClient();
  const admin = await requirePlatformAdmin(supabase);

  const serviceClient = createAdminClient();

  const { data, error } = await serviceClient.from('business_billing_access_overrides').insert({
    business_id: parsed.data.businessId,
    override_type: parsed.data.overrideType,
    ends_at: parsed.data.endsAt || null,
    reason: parsed.data.reason,
    created_by_platform_admin_id: admin.id
  }).select().single();

  if (error) {
    console.error('grantBillingAccessOverride error:', error);
    throw new Error('Failed to grant override');
  }

  return data;
}

export async function revokeBillingAccessOverride(overrideId: string, reason: string) {
  if (!reason || reason.length < 5) throw new Error('A valid reason is required');

  const supabase = await createClient();
  const admin = await requirePlatformAdmin(supabase);

  const serviceClient = createAdminClient();

  const { error } = await serviceClient.from('business_billing_access_overrides').update({
    revoked_at: new Date().toISOString(),
    revoked_by_platform_admin_id: admin.id,
    revoke_reason: reason
  }).eq('id', overrideId).is('revoked_at', null);

  if (error) {
    console.error('revokeBillingAccessOverride error:', error);
    throw new Error('Failed to revoke override');
  }
}
