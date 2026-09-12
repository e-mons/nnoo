import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/app'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      const user = data.user;
      
      let redirectPath = '/onboarding';

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

      // If next is set and not the default /app, try to use it if it's local
      const isLocalRoute = next.startsWith('/') && !next.startsWith('//') && next !== '/app';
      if (isLocalRoute) {
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/sign-in?error=AuthCallbackFailed`)
}
