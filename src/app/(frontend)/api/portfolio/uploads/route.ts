import type { Mapping } from '@/lib/portfolio/ingest/types'
import { parseConfirmed } from '@/lib/portfolio/ingest/tabular'
import { readTable } from '@/lib/portfolio/ingest/table'
import { PdfPasswordError } from '@/lib/portfolio/ingest/pdf-text'
import { getScanConfig } from '@/lib/portfolio/server/config'
import { rateLimit } from '@/lib/portfolio/server/rate-limit'
import { checkFile, parsePdfFile, parseTableFile, rememberMapping, toUploadRows } from '@/lib/portfolio/server/uploads'

export const runtime = 'nodejs'
export const maxDuration = 60

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status })

/**
 * Accepts one holdings file, parses it in memory and returns a preview for the review
 * table. The file and any password are never stored or logged.
 *
 * Form fields: file; optional password (PDF fallback); optional mapping + sheet +
 * headerIndex + signature (user-confirmed columns for an unknown layout).
 */
export async function POST(request: Request) {
  if (!(await rateLimit('scan-upload', 10))) return fail('rate_limited', 429)
  const config = await getScanConfig()
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail('unreadable')
  }
  const file = form.get('file')
  if (!(file instanceof File)) return fail('unreadable')
  if (file.size > config.limits.maxFileMb * 1024 * 1024) return fail('too_large', 413)
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = checkFile(bytes, config.limits.maxFileMb)
  if (kind !== 'pdf' && kind !== 'xlsx' && kind !== 'csv') return fail(kind, kind === 'too_large' ? 413 : 400)

  try {
    let parsed
    if (kind === 'pdf') {
      const password = form.get('password')
      parsed = await parsePdfFile(bytes, typeof password === 'string' && password ? password : undefined)
      if (!parsed) return fail('unreadable')
    } else {
      const mappingRaw = form.get('mapping')
      if (typeof mappingRaw === 'string') {
        const mapping = JSON.parse(mappingRaw) as Mapping
        const sheets = await readTable(bytes)
        parsed = parseConfirmed(sheets, String(form.get('sheet') ?? ''), Number(form.get('headerIndex') ?? 0), mapping)
        const signature = form.get('signature')
        if (typeof signature === 'string' && parsed.records.length) await rememberMapping(signature, mapping)
      } else {
        const out = await parseTableFile(bytes)
        if (out.kind === 'empty') return fail('nothing_found')
        if (out.kind === 'needs_mapping') return Response.json({ ok: true, ...out })
        parsed = out.result
      }
    }
    if (!parsed.records.length) return fail('nothing_found')
    if (parsed.records.length > config.limits.maxHoldings) return fail('too_many')
    const rows = await toUploadRows(parsed.records)
    return Response.json({ ok: true, kind: 'parsed', source: parsed.source, asOf: parsed.asOf, rows, transactions: parsed.transactions, warnings: parsed.warnings })
  } catch (err) {
    if (err instanceof PdfPasswordError) return fail('password', 422)
    // Never log file contents or the password; the error type is enough.
    console.error('[portfolio-scan] upload failed', err instanceof Error ? err.name : 'unknown')
    return fail('unreadable')
  }
}
