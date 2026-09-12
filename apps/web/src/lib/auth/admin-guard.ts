import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ServerAdminContext {
  user: {
    id: string;
    email?: string;
  };
  adminRecord: {
    id: string;
    role: string;
    status: string;
  };
}

/**
 * Server-side guard for Admin page components and Server Actions.
 * Verifies session and confirms active platform_admins membership.
 * Redirects to /sign-in or /app if unauthorized.
 */
export async function requireServerAdmin(): Promise<ServerAdminContext> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/sign-in');
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from('platform_admins')
    .select('id, role, status')
    .eq('user_id', user.id)
    .single();

  if (adminError || !adminRecord || adminRecord.status !== 'active') {
    redirect('/app');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    adminRecord,
  };
}
