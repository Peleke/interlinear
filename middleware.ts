import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get user, handle refresh token errors gracefully
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // If there's a refresh token error, clear the bad cookies to prevent repeated errors
  if (error && error.message?.includes('refresh_token_not_found')) {
    // Clear all Supabase auth cookies
    const authCookies = ['sb-access-token', 'sb-refresh-token']
    authCookies.forEach((cookieName) => {
      response.cookies.delete(cookieName)
    })
  }

  // If there's an auth error (e.g., refresh_token_not_found), treat as unauthenticated
  // This prevents middleware crashes when tokens are stale/invalid
  const isAuthenticated = user && !error

  // Public paths that don't require onboarding check
  const publicPaths = ['/login', '/signup', '/onboarding', '/api']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Check onboarding completion for authenticated users (but not on onboarding/api pages)
  if (isAuthenticated && !isPublicPath) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle()

    // Redirect to onboarding if profile doesn't exist or onboarding not completed
    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Protected routes requiring authentication
  if (request.nextUrl.pathname.startsWith('/reader') ||
      request.nextUrl.pathname.startsWith('/vocabulary') ||
      request.nextUrl.pathname.startsWith('/library') ||
      request.nextUrl.pathname.startsWith('/courses') ||
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/flashcards') ||
      request.nextUrl.pathname.startsWith('/profile')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
