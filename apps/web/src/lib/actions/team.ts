'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function inviteTeamMember(businessId: string, businessSlug: string, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;

  if (!email || !role) {
    return { error: 'Email and role are required.' };
  }

  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash the token before storing it (security best practice)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { error } = await supabase.rpc('create_business_invitation', {
    p_business_id: businessId,
    p_email: email,
    p_role: role,
    p_token_hash: tokenHash,
    p_expires_in_days: 7
  });

  if (error) {
    console.error('Invite error:', error);
    return { error: error.message };
  }

  // TODO: Actually send an email containing the unhashed `token`.
  // For now, in MVP, we just return the link to display it to the user.
  // The link must use the UNHASHED token.
  
  revalidatePath(`/app/${businessSlug}/settings/team`);
  return { success: true, inviteLink: `/invitations/${token}` };
}

export async function revokeInvitation(businessSlug: string, invitationId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.rpc('revoke_business_invitation', {
    p_invitation_id: invitationId
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/app/${businessSlug}/settings/team`);
  return { success: true };
}

export async function updateMemberRole(businessSlug: string, membershipId: string, role: string, status: string = 'active') {
  const supabase = await createClient();
  
  const { error } = await supabase.rpc('update_business_membership', {
    p_membership_id: membershipId,
    p_role: role,
    p_status: status
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/app/${businessSlug}/settings/team`);
  return { success: true };
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  
  // Re-hash the unhashed token provided in the URL to match the DB
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { data, error } = await supabase.rpc('accept_business_invitation', {
    p_token_hash: tokenHash
  });

  if (error) {
    return { error: error.message };
  }

  // Return the business ID so we can redirect them to the dashboard
  return { success: true, businessId: data.business_id };
}
