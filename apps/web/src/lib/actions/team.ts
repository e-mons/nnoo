'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { sendTransactionalEmail } from '@/lib/email/service';

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

  // Fetch business name for personalized invitation email
  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', businessId)
    .maybeSingle();

  const businessName = business?.name || 'an NNOO business';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const fullInviteUrl = `${siteUrl}/invitations/${token}`;

  // Dispatch real transactional email to invitee
  await sendTransactionalEmail({
    to: email,
    subject: `You have been invited to join ${businessName} on NNOO`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0A0D14; color: #FFFFFF; border-radius: 12px; border: 1px solid #1F2937;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8F25C; font-size: 28px; margin: 0; letter-spacing: 2px;">NNOO</h1>
          <p style="color: #9CA3AF; font-size: 14px; margin-top: 4px;">Africa's AI Business Operating System</p>
        </div>
        <div style="background-color: #111827; padding: 24px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
          <h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Team Invitation</h2>
          <p style="color: #D1D5DB; font-size: 15px; line-height: 1.5;">
            You have been invited to join <strong>${businessName}</strong> as a <strong>${role}</strong>.
          </p>
          <div style="margin: 24px 0;">
            <a href="${fullInviteUrl}" style="display: inline-block; background-color: #B8F25C; color: #0A0D14; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px;">Accept Invitation</a>
          </div>
          <p style="color: #9CA3AF; font-size: 13px;">This invitation will expire in 7 days.</p>
        </div>
      </div>
    `,
    text: `You have been invited to join ${businessName} on NNOO as a ${role}.\n\nClick the link to accept your invitation:\n${fullInviteUrl}\n\nThis invitation will expire in 7 days.`,
  });
  
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
