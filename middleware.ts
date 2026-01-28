import { createServerClient } from '@supabase/ssr'
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
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Optimization: Check if we have a Supabase auth cookie at all
    // This avoids a network call for most unauthenticated requests
    const hasAuthCookie = request.cookies.getAll().some(cookie =>
        cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    )

    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
    const isLoginRoute = request.nextUrl.pathname === '/login'
    const isRootRoute = request.nextUrl.pathname === '/'

    // If it's a protected route and we don't even have a cookie, redirect immediately
    if (isProtectedRoute && !hasAuthCookie) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Only call getUser if we have a cookie or if we need to know for sure (root/login)
    let user = null
    if (hasAuthCookie || isRootRoute || isLoginRoute) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        user = authUser
    }

    // 1. If user is at root (/), redirect appropriately
    if (isRootRoute) {
        if (user) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // 2. Protect dashboard routes (final check with real user object)
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 3. If user is logged in, don't let them see login page
    if (isLoginRoute && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
