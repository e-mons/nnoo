import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') ||
                       request.nextUrl.pathname.startsWith('/api/v1/admin')

  // Strictly enforce platform admin authorization for all /admin and /api/v1/admin routes
  if (isAdminRoute) {
    if (!user) {
      if (request.nextUrl.pathname.startsWith('/api/v1/admin')) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
      }
      const url = request.nextUrl.clone()
      url.pathname = '/sign-in'
      return NextResponse.redirect(url)
    }

    const { data: adminRecord } = await supabase
      .from('platform_admins')
      .select('role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!adminRecord) {
      if (request.nextUrl.pathname.startsWith('/api/v1/admin')) {
        return NextResponse.json({ error: 'Forbidden: Platform Admin role required' }, { status: 403 })
      }
      const url = request.nextUrl.clone()
      url.pathname = '/app'
      return NextResponse.redirect(url)
    }
  }

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                           request.nextUrl.pathname.startsWith('/app')

  if (!user && isProtectedRoute) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/sign-in') ||
                      request.nextUrl.pathname.startsWith('/sign-up') ||
                      request.nextUrl.pathname.startsWith('/forgot-password') ||
                      request.nextUrl.pathname.startsWith('/reset-password') ||
                      request.nextUrl.pathname.startsWith('/verify-email')

  // If user is logged in and trying to access auth pages, redirect to correct portal
  if (user && isAuthRoute) {
    let redirectPath = '/onboarding'

    // Check if active platform admin
    const { data: adminRecord } = await supabase
      .from('platform_admins')
      .select('role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (adminRecord) {
      redirectPath = '/admin'
    } else {
      // Check if active business member
      const { data: membershipRecord } = await supabase
        .from('business_memberships')
        .select('role, membership_status')
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .limit(1)
        .maybeSingle()

      if (membershipRecord) {
        redirectPath = '/app'
      }
    }

    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
