import { rateLimit } from '@/lib/portfolio/server/rate-limit'
import { searchInstruments } from '@/lib/portfolio/server/instruments'

/** Autocomplete for manual entry: name, ISIN, AMFI code or NSE symbol. */
export async function GET(request: Request) {
  if (!(await rateLimit('instrument-search', 120))) {
    return Response.json({ error: 'Too many searches. Wait a minute and try again.' }, { status: 429 })
  }
  const q = new URL(request.url).searchParams.get('q') ?? ''
  const results = await searchInstruments(q.slice(0, 80))
  return Response.json({ results }, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
