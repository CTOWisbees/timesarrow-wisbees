'use client'

import { track } from '@vercel/analytics'
import { CheckCircle2, FileUp, KeyRound, Link2, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { parseCas } from '@/lib/portfolio/ingest/cas'
import { type GetDocument, PdfPasswordError, pdfLines } from '@/lib/portfolio/ingest/pdf-text'
import type { Mapping, RawTransaction } from '@/lib/portfolio/ingest/types'
import type { UploadRow } from '@/lib/portfolio/server/uploads'
import { cn } from '@/lib/utils'

import { resolveRecords } from './actions'
import { type Row, uid } from './rows'
import { errorMessage, type ScanCopy } from './shared'

export type Parsed = { rows: Row[]; transactions: RawTransaction[]; source: string; asOf: string | null }

type Props = {
  copy: ScanCopy
  maxFileMb: number
  onParsed: (p: Parsed) => void
  onError: (message: string | null) => void
}

type NeedsMapping = { sheet: string; headerIndex: number; header: string[]; preview: string[][]; suggested: Mapping; headerSignature: string }

const MAPPING_FIELDS: { field: keyof Mapping; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'isin', label: 'ISIN' },
  { field: 'quantity', label: 'Units or shares' },
  { field: 'value', label: 'Current value' },
  { field: 'cost', label: 'Amount invested' },
  { field: 'price', label: 'Price' },
]

const toRow = (r: UploadRow, asOf: string | null): Row => ({
  uid: uid(),
  key: r.key,
  name: r.name,
  type: r.type,
  subCategory: r.subCategory,
  plan: r.plan,
  option: r.option,
  isin: r.isin,
  price: r.price,
  priceDate: r.priceDate,
  quantity: r.quantity,
  investedAmount: null,
  currentValue: r.currentValue,
  costValue: r.costValue,
  suggestions: r.suggestions,
  source: r.sourceRef,
  statementPrice: r.key && r.price && r.type !== 'equity' ? null : r.statementPrice,
  statementDate: asOf,
  accountHash: r.accountHash,
})

/** A salt per page load: folio hashes merge duplicates within this visit and mean nothing afterwards. */
const SALT = typeof crypto !== 'undefined' && 'getRandomValues' in crypto ? Array.from(crypto.getRandomValues(new Uint8Array(8))).join('.') : String(Math.random())

export function UploadPanel({ copy, maxFileMb, onParsed, onError }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState(-1)
  const [needsPassword, setNeedsPassword] = useState<'ask' | 'wrong' | null>(null)
  const [password, setPassword] = useState('')
  const [mapping, setMapping] = useState<NeedsMapping | null>(null)
  const [chosen, setChosen] = useState<Mapping>({})
  const [dragging, setDragging] = useState(false)
  const busy = stage >= 0
  const progress = copy.progress ?? []

  const fail = (code: string) => {
    setStage(-1)
    onError(errorMessage(copy, code))
    track('parse_failed', { reason: code })
  }

  const done = (p: Parsed) => {
    setStage(progress.length - 1)
    track('parse_success', { source: p.source, rows: p.rows.length })
    setTimeout(() => {
      setStage(-1)
      setFile(null)
      setPassword('')
      setNeedsPassword(null)
      setMapping(null)
      onParsed(p)
    }, 300)
  }

  const upload = async (f: File, extra?: Record<string, string>) => {
    const body = new FormData()
    body.set('file', f)
    for (const [k, v] of Object.entries(extra ?? {})) body.set(k, v)
    setStage(1)
    const res = await fetch('/api/portfolio/uploads', { method: 'POST', body })
    const json = (await res.json()) as
      | { ok: false; error: string }
      | ({ ok: true; kind: 'needs_mapping' } & NeedsMapping)
      | { ok: true; kind: 'parsed'; source: string; asOf: string | null; rows: UploadRow[]; transactions: RawTransaction[] }
    if (!json.ok) {
      if (json.error === 'password') {
        setStage(-1)
        setNeedsPassword(extra?.password ? 'wrong' : 'ask')
        return
      }
      return fail(json.error)
    }
    if (json.kind === 'needs_mapping') {
      setStage(-1)
      setMapping(json)
      setChosen(json.suggested)
      return
    }
    setStage(2)
    done({ rows: json.rows.map((r) => toRow(r, json.asOf)), transactions: json.transactions, source: json.source, asOf: json.asOf })
  }

  /** PDFs are opened in the browser so the password never leaves the device. */
  const readPdf = async (f: File, pw?: string) => {
    setStage(0)
    try {
      const pdfjs = (await import('pdfjs-dist')) as unknown as { getDocument: GetDocument; GlobalWorkerOptions: { workerSrc: string } }
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      const pages = await pdfLines(pdfjs.getDocument, new Uint8Array(await f.arrayBuffer()), pw)
      const hashes = new Map<string, string>()
      // Hash folio numbers in the browser; only the hash is sent, for merging duplicates.
      for (const line of pages.flat()) {
        const m = line.match(/Folio\s*No\s*[:.]?\s*([A-Za-z0-9/ ]+?)(?:\s{2,}|\s+PAN|\s+KYC|$)/i)
        if (m && !hashes.has(m[1].trim())) {
          const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${SALT}:${m[1].trim()}`))
          hashes.set(m[1].trim(), Array.from(new Uint8Array(digest).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join(''))
        }
      }
      const parsed = parseCas(pages, (folio) => hashes.get(folio) ?? null)
      if (!parsed) return fail('unreadable')
      if (!parsed.records.length) return fail('nothing_found')
      setStage(1)
      const res = await resolveRecords(parsed.records)
      if (!res.ok) return fail(res.error)
      setStage(2)
      done({ rows: res.rows.map((r) => toRow(r, parsed.asOf)), transactions: parsed.transactions, source: parsed.source, asOf: parsed.asOf })
    } catch (err) {
      if (err instanceof PdfPasswordError) {
        setStage(-1)
        setNeedsPassword(err.wrong ? 'wrong' : 'ask')
        return
      }
      // The browser could not read it: let the server try (the password is used in memory only).
      await upload(f, pw ? { password: pw } : undefined)
    }
  }

  const take = (f: File | undefined) => {
    if (!f) return
    onError(null)
    setMapping(null)
    setNeedsPassword(null)
    if (f.size > maxFileMb * 1024 * 1024) return fail('too_large')
    if (/\.xlsm$/i.test(f.name)) return fail('wrong_type')
    setFile(f)
    track('upload_started', { kind: f.name.split('.').pop()?.toLowerCase() ?? 'unknown' })
    if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) void readPdf(f)
    else void upload(f).catch(() => fail('unreadable'))
  }

  return (
    <div className="space-y-8">
      <div
        onDragOver={(e) => (e.preventDefault(), setDragging(true))}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          take(e.dataTransfer.files[0])
        }}
        className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors', dragging ? 'border-primary bg-mint/40' : 'bg-mist/60')}
      >
        <FileUp className="text-primary size-8" aria-hidden />
        <p className="text-ink font-heading text-xl font-semibold">{copy.dropTitle}</p>
        <p className="text-ink-soft text-sm">{copy.dropHint}</p>
        <input
          ref={input}
          type="file"
          accept=".pdf,.csv,.xlsx,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          id="scan-file"
          onChange={(e) => {
            take(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <Button type="button" onClick={() => input.current?.click()} disabled={busy}>
          Choose a file
        </Button>
      </div>

      {busy && (
        <ol className="space-y-2 text-sm" aria-live="polite">
          {progress.map((p, i) => (
            <li key={p.id ?? p.label} className={cn('flex items-center gap-2', i <= stage ? 'text-ink' : 'text-muted-foreground')}>
              {i < stage ? <CheckCircle2 className="text-primary size-4" aria-hidden /> : i === stage ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <span className="bg-border size-4 rounded-full" aria-hidden />}
              {p.label}
            </li>
          ))}
        </ol>
      )}

      {needsPassword && file && (
        <form
          className="bg-card space-y-3 rounded-2xl border p-5"
          onSubmit={(e) => {
            e.preventDefault()
            setNeedsPassword(null)
            void readPdf(file, password)
          }}
        >
          <Label htmlFor="pdf-password" className="text-ink flex items-center gap-2 font-semibold">
            <KeyRound className="size-4" aria-hidden />
            {copy.passwordLabel}
          </Label>
          <div className="flex gap-2">
            <Input id="pdf-password" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className="max-w-xs" autoFocus />
            <Button type="submit" disabled={!password}>
              Open
            </Button>
          </div>
          <p className={cn('text-xs', needsPassword === 'wrong' ? 'text-destructive' : 'text-muted-foreground')}>{needsPassword === 'wrong' ? 'That password did not open the file. Try again.' : copy.passwordNote}</p>
        </form>
      )}

      {mapping && file && (
        <div className="bg-card space-y-4 rounded-2xl border p-5">
          <div>
            <p className="text-ink font-semibold">{copy.mappingTitle}</p>
            <p className="text-ink-soft mt-1 text-sm">{copy.mappingIntro}</p>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <table className="text-xs">
              <thead className="bg-mist">
                <tr>
                  {mapping.header.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      {h || `Column ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {mapping.preview.map((r, i) => (
                  <tr key={i}>
                    {mapping.header.map((_, c) => (
                      <td key={c} className="px-3 py-1.5 whitespace-nowrap">
                        {r[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {MAPPING_FIELDS.map(({ field, label }) => (
              <div key={field} className="space-y-1">
                <Label className="text-ink-soft text-xs">{label}</Label>
                <Select value={chosen[field] === undefined ? 'none' : String(chosen[field])} onValueChange={(v) => setChosen({ ...chosen, [field]: v === 'none' ? undefined : Number(v) })}>
                  <SelectTrigger className="h-9 w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not in this file</SelectItem>
                    {mapping.header.map((h, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {h || `Column ${i + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <Button
            disabled={(chosen.name === undefined && chosen.isin === undefined) || (chosen.quantity === undefined && chosen.value === undefined)}
            onClick={() =>
              void upload(file, {
                mapping: JSON.stringify(chosen),
                sheet: mapping.sheet,
                headerIndex: String(mapping.headerIndex),
                signature: mapping.headerSignature,
              })
            }
          >
            Use these columns
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="link" className="h-auto p-0">
              {copy.whereTitle}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-md">
            <SheetHeader className="p-0">
              <SheetTitle className="font-heading text-2xl">{copy.whereTitle}</SheetTitle>
              <SheetDescription>{copy.acceptedSources}</SheetDescription>
            </SheetHeader>
            <div className="mt-8 space-y-8">
              {copy.sources?.map((s) => (
                <section key={s.id ?? s.name}>
                  <h3 className="font-sans text-base font-semibold">{s.name}</h3>
                  <ol className="text-ink-soft mt-2 list-decimal space-y-1 pl-5 text-sm">
                    {s.steps.split('\n').filter(Boolean).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </section>
              ))}
              {copy.aaNote && (
                <p className="text-muted-foreground flex items-start gap-2 border-t pt-6 text-sm">
                  <Link2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {copy.aaNote}
                </p>
              )}
            </div>
          </SheetContent>
        </Sheet>
        <a href="/portfolio-scan-template.csv" download className="text-primary font-medium underline-offset-4 hover:underline">
          {copy.templateLabel}
        </a>
      </div>
    </div>
  )
}
