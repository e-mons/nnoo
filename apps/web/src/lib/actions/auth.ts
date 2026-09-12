'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { 
  signUpSchema, 
  signInSchema, 
  verifyEmailOtpSchema,
  resendOtpSchema,
  SignUpInput, 
  SignInInput,
  VerifyEmailOtpInput,
  ResendOtpInput,
} from '@nnoo/validation/auth';

export async function signUpAction(formData: SignUpInput, nextUrl: string = '/app') {
  const result = signUpSchema.safeParse(formData);

  if (!result.success) {
    return { error: 'Invalid form data. Please check your inputs.' };
  }

  const { email, password, firstName, lastName } = result.data;
  const supabase = await createClient();

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback${nextUrl !== '/app' ? `?next=${nextUrl}` : ''}`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If Supabase is configured with email confirmations enabled,
  // data.session will be null and we need to verify email.
  return { 
    success: true, 
    requiresEmailVerification: !data.session,
    email 
  };
}

export async function verifyEmailOtpAction(formData: VerifyEmailOtpInput) {
  const result = verifyEmailOtpSchema.safeParse(formData);

  if (!result.success) {
    return { error: result.error.errors[0]?.message || 'Invalid verification code.' };
  }

  const { email, token } = result.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });

  if (error) {
    return { error: error.message };
  }

  const user = data?.user;
  let redirectPath = '/onboarding';

  if (user) {
    const { data: adminRecord } = await supabase
      .from('platform_admins')
      .select('role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (adminRecord) {
      redirectPath = '/admin';
    } else {
      const { data: membershipRecord } = await supabase
        .from('business_memberships')
        .select('role, membership_status')
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .limit(1)
        .maybeSingle();

      if (membershipRecord) {
        redirectPath = '/app';
      }
    }
  }

  revalidatePath(redirectPath, 'layout');
  return { success: true, redirectTo: redirectPath };
}

export async function resendOtpAction(formData: ResendOtpInput) {
  const result = resendOtpSchema.safeParse(formData);

  if (!result.success) {
    return { error: 'Please provide a valid email address.' };
  }

  const { email } = result.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signInAction(formData: SignInInput) {
  const result = signInSchema.safeParse(formData);

  if (!result.success) {
    return { error: 'Invalid form data.' };
  }

  const { email, password } = result.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const user = data?.user;
  let redirectPath = '/onboarding';

  if (user) {
    const { data: adminRecord } = await supabase
      .from('platform_admins')
      .select('role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (adminRecord) {
      redirectPath = '/admin';
    } else {
      const { data: membershipRecord } = await supabase
        .from('business_memberships')
        .select('role, membership_status')
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .limit(1)
        .maybeSingle();

      if (membershipRecord) {
        redirectPath = '/app';
      }
    }
  }

  revalidatePath(redirectPath, 'layout');
  return { success: true, redirectTo: redirectPath };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/sign-in');
}

export async function forgotPasswordAction(email: string) {
  if (!email || typeof email !== 'string') {
    return { error: 'Please enter a valid email address.' };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Prevent account enumeration by returning a generic success message
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error('Forgot password error:', error);
  }

  return { success: true };
}

export async function updatePasswordAction(password: string) {
  const supabase = await createClient();
  
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/app');
}
