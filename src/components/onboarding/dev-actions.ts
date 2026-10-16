'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'

import { type ActionResult, logInSchema, signUpSchema } from '@/lib/onboarding'
import { devAuthBypassEnabled } from '@/lib/supabase/dev-bypass'
import { supabaseUrl } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Input = { mode: 'signup' | 'login'; email: string; fullName?: string; phone?: string; consent?: boolean }

/**
 * DEV ONLY (see `devAuthBypassEnabled`): signs the visitor in without sending an email,
 * so demos are not blocked by Supabase's hourly email limit. It asks the Admin API for
 * a one-time sign-in token (no email goes out) and redeems it straight away, which sets
 * the normal session cookie. Everything after this is the real flow.
 */
export async function devSignIn(input: Input): Promise<ActionResult> {
  if (!devAuthBypassEnabled()) return { ok: false, error: 'Not available.' }

  let email: string
  let data: Record<string, string> | undefined
  if (input.mode === 'signup') {
    const parsed = signUpSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'Please check the highlighted fields.' }
    email = parsed.data.email
    data = { full_name: parsed.data.fullName, phone: parsed.data.phone, consent_at: new Date().toISOString() }
  } else {
    const parsed = logInSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'Enter a valid email address' }
    email = parsed.data.email
  }

  const admin = createAdminClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (input.mode === 'login') {
    // Mirror the real flow: logging in needs an existing account.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (!list?.users.some((u) => u.email?.toLowerCase() === email)) {
      return { ok: false, error: 'We could not find an account with this email. Create one instead.' }
    }
  }

  // Creates the user on first use (with the sign-up details) and returns a token hash.
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { data } })
  if (error || !link.properties?.hashed_token) {
    console.error('Dev sign-in: generateLink failed', error?.message)
    return { ok: false, error: 'Dev sign-in failed. Check SUPABASE_SECRET_KEY.' }
  }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' })
  if (verifyError) {
    console.error('Dev sign-in: verifyOtp failed', verifyError.message)
    return { ok: false, error: 'Dev sign-in failed. Please try again.' }
  }
  return { ok: true }
}
