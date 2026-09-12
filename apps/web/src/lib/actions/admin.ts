/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';

// Reusable function to verify if the current user is an active admin.
// Returns the admin record if authorized, otherwise throws an error.
async function verifyAdminAuthorization() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const adminClient = createAdminClient();
  const { data: adminRecord } = await adminClient
    .from('platform_admins')
    .select('id, role, status')
    .eq('user_id', user.id)
    .single();

  if (!adminRecord || adminRecord.status !== 'active') {
    throw new Error('Not authorized as platform admin');
  }

  return { user, adminRecord };
}

// Function to log an audit event
async function logAuditEvent(
  adminClient: any, 
  actorId: string, 
  action: string, 
  targetType: string, 
  targetId: string | null, 
  reason: string, 
  metadata: any = {}
) {
  const { error } = await adminClient
    .from('platform_audit_events')
    .insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      reason,
      metadata
    });
  
  if (error) {
    console.error('Failed to log audit event:', error);
    // We typically don't throw here to avoid failing the main action, 
    // but in a strict system we might want to.
  }
}

/**
 * Suspend a user.
 */
export async function suspendUserAction(userId: string, reason: string) {
  if (!reason || reason.trim().length < 5) {
    return { error: 'A valid reason (at least 5 characters) is required for suspension.' };
  }

  try {
    const { adminRecord } = await verifyAdminAuthorization();
    const adminClient = createAdminClient();

    // 1. Update the profile status
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ account_status: 'suspended' })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 2. Log audit event
    await logAuditEvent(
      adminClient, 
      adminRecord.id, 
      'suspend_user', 
      'user', 
      userId, 
      reason
    );

    return { success: true };
  } catch (err: any) {
    console.error('Failed to suspend user:', err);
    return { error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Restore a user.
 */
export async function restoreUserAction(userId: string, reason: string = 'Administrative restoration') {
  try {
    const { adminRecord } = await verifyAdminAuthorization();
    const adminClient = createAdminClient();

    // 1. Update the profile status
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ account_status: 'active' })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 2. Log audit event
    await logAuditEvent(
      adminClient, 
      adminRecord.id, 
      'restore_user', 
      'user', 
      userId, 
      reason
    );

    return { success: true };
  } catch (err: any) {
    console.error('Failed to restore user:', err);
    return { error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Suspend a business.
 */
export async function suspendBusinessAction(businessId: string, reason: string) {
  if (!reason || reason.trim().length < 5) {
    return { error: 'A valid reason (at least 5 characters) is required for suspension.' };
  }

  try {
    const { adminRecord } = await verifyAdminAuthorization();
    const adminClient = createAdminClient();

    const { error: bizError } = await adminClient
      .from('businesses')
      .update({ status: 'suspended' })
      .eq('id', businessId);

    if (bizError) throw bizError;

    await logAuditEvent(
      adminClient, 
      adminRecord.id, 
      'suspend_business', 
      'business', 
      businessId, 
      reason
    );

    return { success: true };
  } catch (err: any) {
    console.error('Failed to suspend business:', err);
    return { error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Restore a business.
 */
export async function restoreBusinessAction(businessId: string, reason: string = 'Administrative restoration') {
  try {
    const { adminRecord } = await verifyAdminAuthorization();
    const adminClient = createAdminClient();

    const { error: bizError } = await adminClient
      .from('businesses')
      .update({ status: 'active' })
      .eq('id', businessId);

    if (bizError) throw bizError;

    await logAuditEvent(
      adminClient, 
      adminRecord.id, 
      'restore_business', 
      'business', 
      businessId, 
      reason
    );
    return { success: true };
  } catch (err: any) {
    console.error('Failed to restore business:', err);
    return { error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Update the status of a contact enquiry.
 */
export async function updateEnquiryStatusAction(enquiryId: string, status: string) {
  try {
    const { adminRecord } = await verifyAdminAuthorization();
    const adminClient = createAdminClient();

    const { error: updateError } = await adminClient
      .from('contact_enquiries')
      .update({ status })
      .eq('id', enquiryId);

    if (updateError) throw updateError;

    await logAuditEvent(
      adminClient,
      adminRecord.id,
      'update_enquiry_status',
      'enquiry',
      enquiryId,
      `Status changed to ${status}`
    );

    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/admin/enquiries/${enquiryId}`);
    revalidatePath('/admin/enquiries');

    return { success: true };
  } catch (err: any) {
    console.error('Failed to update enquiry status:', err);
    return { error: err.message || 'An unexpected error occurred' };
  }
}
