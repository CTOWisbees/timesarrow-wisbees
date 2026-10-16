import { type NextRequest, NextResponse } from 'next/server'

import { safeNext } from '@/lib/next-path'
import { createClient } from '@/lib/supabase/server'

/**
 * Lands here after Google sign-in, or from the sign-in link in the code email
 * (PKCE). Exchanges the one-time code for a session cookie, then continues.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }
  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
