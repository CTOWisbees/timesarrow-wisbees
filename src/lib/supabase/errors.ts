import type { AuthError } from '@supabase/supabase-js'

export type AuthMode = 'signup' | 'login'

/** Supabase Auth errors, in words a visitor can act on. */
export function authErrorMessage(error: AuthError, mode?: AuthMode) {
  switch (error.code) {
    case 'otp_disabled':
    case 'signup_disabled':
    case 'user_not_found':
      return mode === 'login'
        ? 'We could not find an account with this email. Create one instead.'
        : 'Sign-ups are switched off at the moment. Please try again later.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.'
    case 'email_address_invalid':
      return 'This email address cannot receive codes. Please use another one.'
    case 'otp_expired':
      return 'That code is wrong or has expired. Check the latest email, or send a new code.'
    default:
      return 'Something went wrong. Please try again in a minute.'
  }
}

