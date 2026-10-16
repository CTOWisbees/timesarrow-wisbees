import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { supabaseConfigured, supabaseKey, supabaseUrl } from './env'

/**
 * Server client for Server Components, Server Actions and Route Handlers. Create one
 * per request. Server Components cannot write cookies, so `setAll` failures there are
 * ignored: `src/proxy.ts` refreshes the session on every request instead.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component; the proxy writes the refreshed cookies.
        }
      },
    },
  })
}

/**
 * The signed-in user, verified. `getClaims()` checks the token signature, so this is
 * safe for access decisions (never trust `getSession()` on the server).
 */
export async function getCurrentUser() {
  if (!supabaseConfigured) return null
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null
  const claims = data.claims
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>
  const provider = (claims.app_metadata as { provider?: string } | undefined)?.provider
  return {
    id: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : '',
    fullName: String(meta.full_name ?? meta.name ?? ''),
    phone: typeof meta.phone === 'string' ? meta.phone : '',
    provider: provider === 'google' ? ('google' as const) : ('email' as const),
    avatarUrl: typeof meta.avatar_url === 'string' ? meta.avatar_url : null,
    /** When they ticked the sign-up consent box (email sign-ups only). */
    consentAt: typeof meta.consent_at === 'string' ? meta.consent_at : null,
  }
}
