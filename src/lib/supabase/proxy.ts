import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { supabaseConfigured, supabaseKey, supabaseUrl } from './env'

/**
 * Refreshes the Supabase session cookie on each request so users stay signed in.
 * Returns the response that carries the refreshed cookies; return it as is.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!supabaseConfigured) return response

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        // Stops CDNs caching a response that carries a session.
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  // Do not put code between createServerClient and getClaims: it refreshes the token.
  await supabase.auth.getClaims()
  return response
}
