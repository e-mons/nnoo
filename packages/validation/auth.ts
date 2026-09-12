import { z } from 'zod';

// ─── Email ───────────────────────────────────────────────────────────
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email is too long');

// ─── Password ────────────────────────────────────────────────────────
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

// ─── Names ───────────────────────────────────────────────────────────
export const firstNameSchema = z
  .string()
  .trim()
  .min(1, 'First name is required')
  .max(100, 'First name is too long');

export const lastNameSchema = z
  .string()
  .trim()
  .min(1, 'Last name is required')
  .max(100, 'Last name is too long');

export const displayNameSchema = z
  .string()
  .trim()
  .max(150, 'Display name is too long')
  .optional()
  .nullable();

// ─── Phone ───────────────────────────────────────────────────────────
export const phoneSchema = z
  .string()
  .trim()
  .max(30, 'Phone number is too long')
  .optional()
  .nullable();

// ─── Verification Code (OTP) ─────────────────────────────────────────
export const otpCodeSchema = z
  .string()
  .trim()
  .length(6, 'Verification code must be 6 digits')
  .regex(/^\d{6}$/, 'Verification code must contain only numbers');

// ─── Composed schemas ────────────────────────────────────────────────

/** Schema for the sign-up form (web + mobile). */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
});

/** Schema for the sign-in form (web + mobile). */
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** Schema for verifying email OTP code (web + mobile). */
export const verifyEmailOtpSchema = z.object({
  email: emailSchema,
  token: otpCodeSchema,
  type: z.enum(['signup', 'email', 'recovery', 'invite', 'email_change']).default('signup').optional(),
});

/** Schema for resending verification code (web + mobile). */
export const resendOtpSchema = z.object({
  email: emailSchema,
  type: z.enum(['signup', 'email_change', 'sms']).default('signup').optional(),
});

/** Schema for updating editable profile fields. */
export const profileUpdateSchema = z.object({
  firstName: firstNameSchema.optional(),
  lastName: lastNameSchema.optional(),
  displayName: displayNameSchema,
  phone: phoneSchema,
  avatarUrl: z.string().url('Invalid URL').max(2048).optional().nullable(),
  preferredLocale: z.string().min(2).max(10).optional(),
});

// ─── Inferred types ──────────────────────────────────────────────────
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
