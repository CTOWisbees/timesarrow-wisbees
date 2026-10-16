/** Supabase Auth credentials. The publishable key is safe in the browser; never put a secret key here. */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey)
