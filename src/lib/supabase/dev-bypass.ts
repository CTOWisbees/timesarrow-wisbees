/**
 * Local demo mode (AUTH_DEV_BYPASS=true, never in production builds). Every onboarding
 * step can be opened without signing in, and submitting a step just moves on; nothing
 * is sent to Supabase or saved. Never set AUTH_DEV_BYPASS in .env.production or on Vercel.
 */
export const demoModeEnabled = () => process.env.NODE_ENV !== 'production' && process.env.AUTH_DEV_BYPASS === 'true'

/** Demo mode with a secret key: signs in for real without the email code. */
export const devAuthBypassEnabled = () => demoModeEnabled() && Boolean(process.env.SUPABASE_SECRET_KEY)
