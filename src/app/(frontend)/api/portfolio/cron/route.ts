import { runNightly } from '@/lib/portfolio/server/nightly'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Nightly job (Vercel Cron, or `pnpm scan:nightly` locally). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; without a secret it only runs in development.
 * `?force=1` re-scores every saved portfolio now; `?prices=0` skips the NAV download.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorised = secret ? request.headers.get('authorization') === `Bearer ${secret}` : process.env.NODE_ENV !== 'production'
  if (!authorised) return new Response('Unauthorised', { status: 401 })
  const url = new URL(request.url)
  const log = await runNightly({ force: url.searchParams.get('force') === '1', loadPrices: url.searchParams.get('prices') !== '0' })
  return Response.json({ ok: true, log })
}
