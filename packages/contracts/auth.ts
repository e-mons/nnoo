// ─── Auth error codes ────────────────────────────────────────────────
// Safe error identifiers that the application layer maps to user-facing
// messages.  Never expose provider stack traces through these codes.

export const AUTH_ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_ACCOUNT_RESTRICTED: 'AUTH_ACCOUNT_RESTRICTED',
  AUTH_RATE_LIMITED: 'AUTH_RATE_LIMITED',
  AUTH_VALIDATION_ERROR: 'AUTH_VALIDATION_ERROR',
  AUTH_PROVIDER_ERROR: 'AUTH_PROVIDER_ERROR',
  AUTH_USER_ALREADY_EXISTS: 'AUTH_USER_ALREADY_EXISTS',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

// ─── Generic result type ─────────────────────────────────────────────

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: AuthErrorCode; message: string } };

// ─── Account status ──────────────────────────────────────────────────

export const ACCOUNT_STATUSES = ['active', 'suspended', 'restricted'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

// ─── User profile ────────────────────────────────────────────────────
// Matches the public.profiles table shape.  Generated DB types should be
// the ground truth; this contract provides an application-level view
// independent of the Supabase client typings.

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  preferredLocale: string;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}
