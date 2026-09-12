import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { AISafeError } from '../service';

export interface PlatformAdminContext {
  user: User;
  adminRecord: {
    id: string;
    role: 'super_admin' | 'admin' | 'support';
    status: 'active' | 'suspended';
  };
}

/**
 * Server-side authorization guard for NNOO Platform Admin intelligence operations.
 * Strictly verifies authenticated user against public.platform_admins with active status.
 */
export async function requirePlatformAdmin(
  supabase: SupabaseClient
): Promise<PlatformAdminContext> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AISafeError(
      'ADMIN_UNAUTHENTICATED' as any,
      'Authentication required for Platform Admin access.',
      false
    );
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from('platform_admins')
    .select('id, role, status')
    .eq('user_id', user.id)
    .single();

  if (adminError || !adminRecord || adminRecord.status !== 'active') {
    throw new AISafeError(
      'ADMIN_FORBIDDEN' as any,
      'Active Platform Admin role required.',
      false
    );
  }

  return {
    user,
    adminRecord: adminRecord as any,
  };
}
