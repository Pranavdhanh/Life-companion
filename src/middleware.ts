import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = 
    request.nextUrl.pathname.startsWith('/login') || 
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password') ||
    request.nextUrl.pathname.startsWith('/api/auth/callback')
  
  if (!user && !isAuthRoute && request.nextUrl.pathname !== '/') {
    // Redirect to login if unauthenticated and not on auth routes
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin route protection
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/role-router';
      return NextResponse.redirect(url);
    }
  }

  // Cross-role route protection — each user can only access their own role's routes
  const isRoleRoute = 
    request.nextUrl.pathname.startsWith('/patient') ||
    request.nextUrl.pathname.startsWith('/caregiver') ||
    request.nextUrl.pathname.startsWith('/asha') ||
    request.nextUrl.pathname.startsWith('/admin')

  if (user && isRoleRoute) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role

    const wrongRoute =
      (request.nextUrl.pathname.startsWith('/patient') && role !== 'PATIENT') ||
      (request.nextUrl.pathname.startsWith('/caregiver') && role !== 'CAREGIVER') ||
      (request.nextUrl.pathname.startsWith('/asha') && role !== 'ASHA') ||
      (request.nextUrl.pathname.startsWith('/admin') && role !== 'ADMIN')

    if (wrongRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/role-router'
      return NextResponse.redirect(url)
    }
  }

  // If logged in and on login/register pages, redirect to dashboard based on role
  // (We skip redirecting if on reset-password so they can actually set it)
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register' || request.nextUrl.pathname === '/')) {
    const url = request.nextUrl.clone()
    
    // We ideally should fetch the user role from 'profiles' to route correctly, 
    // but middleware runs on the edge and direct DB calls via Supabase JS might be tricky 
    // We redirect to a special /role-router page that handles client-side redirection
    // based on the user's role in the database.
    url.pathname = '/role-router'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
