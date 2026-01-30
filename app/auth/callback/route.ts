import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // In local development, origin might be 'http://localhost:3000'
            const redirectUrl = new URL(next, origin);
            return NextResponse.redirect(redirectUrl.toString());
        }

        console.error('Auth callback error:', error)
    }

    // Redirect to login with error instead of non-existent page
    return NextResponse.redirect(new URL('/login?error=auth-code-error', origin).toString())
}
