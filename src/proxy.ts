import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Every page that may show who is signed in (the site header does). Skips the CMS,
  // the API, Next internals and static files.
  matcher: ['/((?!admin|api|_next/static|_next/image|.*\\.[a-z0-9]+$).*)'],
}
