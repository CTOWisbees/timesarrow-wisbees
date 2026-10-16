import { createBrowserClient } from '@supabase/ssr'

import { supabaseKey, supabaseUrl } from './env'

/** Browser client. `createBrowserClient` is a singleton, so calling this repeatedly is cheap. */
export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey)
