import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/lib/payload'

/**
 * Draft preview for CMS staff. Linked from the admin "Preview" button; only works
 * for a logged-in Payload user, so visitors can never see unpublished content.
 */
export async function GET(request: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return new Response('Log in to the CMS to preview drafts.', { status: 401 })

  const path = new URL(request.url).searchParams.get('path') ?? '/'
  ;(await draftMode()).enable()
  redirect(path.startsWith('/') && !path.startsWith('//') ? path : '/')
}
