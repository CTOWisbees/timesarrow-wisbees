'use client'

import { track } from '@vercel/analytics'
import { ArrowLeft, Banknote, ChevronDown, ClipboardPaste, Loader2, ShieldCheck } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatInr } from '@/lib/format-inr'
import type { ScanView } from '@/lib/portfolio/entitlements'
import type { RawTransaction } from '@/lib/portfolio/ingest/types'
import type { HoldingPeriod, Horizon, TransactionInput } from '@/lib/portfolio/model'
import { parsePasted } from '@/lib/portfolio/paste'
import { cn } from '@/lib/utils'

import { instrumentDetails, resolveRows, runSample, runScan } from './actions'
import { HoldingSearch } from './holding-search'
import { HoldingsTable } from './holdings-table'
import { Results } from './results'
import { cashRow, fromResolved, isComplete, type Row, rowValue, toInput } from './rows'
import { errorMessage, fill, type ScanCopy } from './shared'
import { type Parsed, UploadPanel } from './upload-panel'

type Step = 'choose' | 'review' | 'details' | 'results'

export type ScanAppProps = {
  copy: ScanCopy
  benchmarks: { id: string; name: string }[]
  initialView: ScanView | null
  signedIn: boolean
  demoMode: boolean
  maxFileMb: number
}

const PERIODS: { value: HoldingPeriod; label: string }[] = [
  { value: 'lt1', label: 'Under 1 year' },
  { value: '1to3', label: '1–3 years' },
  { value: '3to5', label: '3–5 years' },
  { value: '5plus', label: '5+ years' },
]
const HORIZONS: { value: Horizon; label: string }[] = [
  { value: 'lt3', label: 'Within 3 years' },
  { value: '3to5', label: '3–5 years' },
  { value: '5plus', label: 'After 5 years' },
]

export function ScanApp({ copy, benchmarks, initialView, signedIn, demoMode, maxFileMb }: ScanAppProps) {
  const [step, setStep] = useState<Step>(initialView ? 'results' : 'choose')
  const [rows, setRows] = useState<Row[]>([])
  const [view, setView] = useState<ScanView | null>(initialView)
  const [period, setPeriod] = useState<HoldingPeriod | ''>('')
  const [investmentDate, setInvestmentDate] = useState('')
  const [horizon, setHorizon] = useState<Horizon | ''>('')
  const [benchmarkId, setBenchmarkId] = useState('NIFTY50_TRI')
  const [sources, setSources] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [transactions, setTransactions] = useState<RawTransaction[]>([])
  const [duplicates, setDuplicates] = useState<{ names: string[]; dropped: Row[] } | null>(null)
  const [pending, startTransition] = useTransition()

  const update = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.uid === id ? { ...r, ...patch } : r)))
  const remove = (id: string) => setRows((rs) => rs.filter((r) => r.uid !== id))
  const addRows = (more: Row[], source?: string) => {
    setRows((rs) => [...rs, ...more])
    if (source) setSources((s) => (s.includes(source) ? s : [...s, source]))
    setError(null)
  }

  /**
   * A file's rows join the list. When the same ISIN already came from another file,
   * the newer statement is kept (the user can keep both instead).
   */
  const addParsed = (p: Parsed) => {
    const fromFiles = rows.filter((r) => r.statementDate !== undefined && r.isin)
    const dropped: Row[] = []
    const incoming: Row[] = []
    let current = rows
    for (const r of p.rows) {
      const dup = r.isin ? fromFiles.find((x) => x.isin === r.isin && x.accountHash !== r.accountHash) : undefined
      if (!dup) {
        incoming.push(r)
        continue
      }
      if ((r.statementDate ?? '') >= (dup.statementDate ?? '')) {
        current = current.filter((x) => x.uid !== dup.uid)
        dropped.push(dup)
        incoming.push(r)
      } else dropped.push(r)
    }
    setRows([...current, ...incoming])
    setTransactions((t) => [...t, ...p.transactions])
    setSources((s) => (s.includes(p.source) ? s : [...s, p.source]))
    setDuplicates(dropped.length ? { names: [...new Set(dropped.map((d) => d.name))], dropped } : null)
    setError(null)
    setStep('review')
  }

  const pickSuggestion = async (id: string, key: string) => {
    const hit = await instrumentDetails(key)
    if (hit) update(id, { key: hit.key, name: hit.name, type: hit.type, subCategory: hit.subCategory, plan: hit.plan, option: hit.option, isin: hit.isin, price: hit.price, priceDate: hit.priceDate, suggestions: [] })
  }

  const paste = () =>
    startTransition(async () => {
      const parsed = parsePasted(pasteText)
      if (!parsed.length) return setError(errorMessage(copy, 'nothing_found'))
      const res = await resolveRows(parsed.map((p) => ({ name: p.name, isin: p.isin, type: p.looksLikeStock ? 'equity' : 'mutual_fund' })))
      if (!res.ok) return setError(errorMessage(copy, res.error))
      addRows(
        res.rows.map((r, i) => fromResolved(r, { quantity: parsed[i].quantity, investedAmount: parsed[i].amount, costValue: parsed[i].amount })),
        'paste',
      )
      setPasteOpen(false)
      setPasteText('')
      track('manual_row_added', { via: 'paste' })
    })

  const usable = rows.filter(isComplete)
  const unmatched = rows.filter((r) => !r.key && r.type !== 'cash')
  const total = usable.reduce((s, r) => s + (rowValue(r) ?? 0), 0)

  const submit = () =>
    startTransition(async () => {
      setError(null)
      // Statement transactions attach to the holding with the same ISIN (for XIRR and the tax view).
      const indexByIsin = new Map(usable.map((r, i) => [r.isin, i] as const).filter(([isin]) => isin))
      const tx: TransactionInput[] = transactions
        .filter((t) => t.isin && indexByIsin.has(t.isin))
        .map((t) => ({ holdingIndex: indexByIsin.get(t.isin)!, date: t.date, type: t.type, units: t.units, amount: t.amount }))
      const res = await runScan({
        holdings: usable.map(toInput),
        transactions: tx.length ? tx : undefined,
        holdingPeriod: investmentDate ? null : period || null,
        investmentDate: investmentDate || null,
        horizon: horizon || null,
        benchmarkId,
        sourceTypes: sources.length ? sources : ['manual'],
      })
      if (!res.ok) return setError(errorMessage(copy, res.error))
      setView(res.view)
      setStep('results')
      track('results_viewed', { score_band: res.view.score.band })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

  const sample = () =>
    startTransition(async () => {
      const res = await runSample()
      if (!res.ok) return setError(errorMessage(copy, res.error))
      setView(res.view)
      setStep('results')
      track('results_viewed', { sample: true })
    })

  const restart = () => {
    setStep('choose')
    setRows([])
    setSources([])
    setTransactions([])
    setDuplicates(null)
    setError(null)
  }

  const stepIndex = { choose: 0, review: 1, details: 2, results: 3 }[step]
  const stepLabels = [copy.steps.choose, copy.steps.review, copy.steps.details, copy.steps.results]

  return (
    <div className="bg-paper">
      <div className="container-page py-14 md:py-20">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{copy.title}</h1>
          {step !== 'results' && (
            <>
              <p className="text-ink-soft mt-5 text-base leading-relaxed md:text-lg">{copy.intro}</p>
              <p className="bg-mint text-brand-green-strong mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium">
                <ShieldCheck className="size-4" aria-hidden />
                {copy.trustLine}
              </p>
            </>
          )}
        </header>

        <ol className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-sm" aria-label="Progress">
          {stepLabels.map((label, i) => (
            <li key={label} aria-current={i === stepIndex ? 'step' : undefined} className={cn('flex items-center gap-2', i === stepIndex ? 'text-ink font-semibold' : i < stepIndex ? 'text-ink-soft' : 'text-muted-foreground')}>
              <span aria-hidden className={cn('size-2 rounded-full', i <= stepIndex ? 'bg-primary' : 'bg-border')} />
              {label}
            </li>
          ))}
        </ol>

        {error && (
          <Alert variant="destructive" className="mt-6 max-w-3xl">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {step === 'choose' && (
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-14">
            <div className="bg-card min-w-0 rounded-3xl border p-6 sm:p-10">
              <Tabs defaultValue="manual">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="upload">{copy.uploadTab}</TabsTrigger>
                  <TabsTrigger value="manual">{copy.manualTab}</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-6">
                  <UploadPanel copy={copy} maxFileMb={maxFileMb} onParsed={addParsed} onError={setError} />
                </TabsContent>
                <TabsContent value="manual" className="mt-6 space-y-5">
                  <HoldingSearch
                    label={copy.searchLabel}
                    placeholder={copy.searchPlaceholder}
                    onPick={(hit) => {
                      addRows([fromResolved({ ...hit, confidence: 1, suggestions: [] })], 'manual')
                      track('manual_row_added', { type: hit.type })
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => addRows([cashRow()], 'manual')}>
                      <Banknote className="size-4" aria-hidden />
                      {copy.addCash}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPasteOpen(true)}>
                      <ClipboardPaste className="size-4" aria-hidden />
                      {copy.pasteLabel}
                    </Button>
                  </div>
                  {rows.length ? (
                    <HoldingsTable rows={rows} copy={copy} mode="edit" onChange={update} onRemove={remove} onPickSuggestion={pickSuggestion} />
                  ) : (
                    <p className="text-muted-foreground rounded-2xl border border-dashed px-4 py-8 text-center text-sm">{copy.emptyState}</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <aside className="space-y-8 lg:pt-2">
              {copy.showSample && (
                <Button variant="outline" size="lg" className="w-full" onClick={sample} disabled={pending}>
                  {pending ? 'Preparing sample…' : copy.sampleLink}
                </Button>
              )}
              <details className="group text-sm">
                <summary className="text-ink hover:text-primary flex cursor-pointer list-none items-center justify-between gap-2 font-medium [&::-webkit-details-marker]:hidden">
                  How we handle your data
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="text-ink-soft mt-3 leading-relaxed">{copy.consentNotice}</p>
              </details>
            </aside>

            <StickyBar>
              <p className="text-ink-soft text-sm">
                {usable.length} holdings{total ? ` · ${formatInr(total)}` : ''}
              </p>
              <Button size="cta" disabled={!usable.length || pending} onClick={() => setStep('review')}>
                Continue
              </Button>
            </StickyBar>
          </div>
        )}

        {step === 'review' && (
          <div className="mt-10 space-y-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight">{copy.reviewTitle}</h2>
              <p className="text-ink-soft mt-3">{copy.reviewIntro}</p>
            </div>
            <div className="text-ink flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                <strong className="tabular-nums">{formatInr(total)}</strong> total
              </span>
              <span>{usable.length} recognised</span>
              {unmatched.length > 0 && <span className="text-amber-ink font-medium">{unmatched.length} need a match</span>}
              {rows.length - usable.length > 0 && <span className="text-muted-foreground">{rows.length - usable.length} skipped (no quantity or value)</span>}
            </div>
            {duplicates && (
              <div className="bg-amber-soft border-amber-line flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm">
                <p className="text-amber-ink">{duplicates.names.map((n) => fill(copy.duplicateNotice, { name: n })).join(' ')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRows((rs) => [...rs, ...duplicates.dropped])
                    setDuplicates(null)
                  }}
                >
                  Keep both
                </Button>
              </div>
            )}
            <HoldingsTable rows={rows} copy={copy} mode="review" onChange={update} onRemove={remove} onPickSuggestion={pickSuggestion} />
            <StickyBar>
              <Button variant="ghost" onClick={() => setStep('choose')}>
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
              <Button size="cta" disabled={!usable.length} onClick={() => (track('review_confirmed', { rows: usable.length }), setStep('details'))}>
                {copy.reviewConfirm}
              </Button>
            </StickyBar>
          </div>
        )}

        {step === 'details' && (
          <div className="mt-10 max-w-2xl space-y-8">
            <h2 className="text-2xl font-semibold tracking-tight">{copy.detailsTitle}</h2>
            <div className="bg-card space-y-10 rounded-3xl border p-6 sm:p-10">
              <fieldset className="space-y-4">
                <legend className="text-ink text-sm font-semibold">{copy.holdingPeriodLabel}</legend>
                <p className="text-muted-foreground -mt-1 text-sm">{copy.holdingPeriodWhy}</p>
                <ToggleGroup type="single" value={period} onValueChange={(v) => setPeriod(v as HoldingPeriod | '')} spacing={2} className="flex flex-wrap" aria-label={copy.holdingPeriodLabel}>
                  {PERIODS.map((p) => (
                    <ToggleGroupItem key={p.value} value={p.value} variant="outline" className="data-[state=on]:bg-primary data-[state=on]:text-white">
                      {p.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Label htmlFor="investment-date" className="text-ink-soft text-sm font-normal">
                    Or the date you first invested
                  </Label>
                  <input
                    id="investment-date"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                    className="border-input h-10 rounded-md border bg-white px-3 text-sm"
                  />
                </div>
              </fieldset>
              <fieldset className="space-y-4">
                <legend className="text-ink text-sm font-semibold">{copy.horizonLabel}</legend>
                <p className="text-muted-foreground -mt-1 text-sm">{copy.horizonWhy}</p>
                <ToggleGroup type="single" value={horizon} onValueChange={(v) => setHorizon(v as Horizon | '')} spacing={2} className="flex flex-wrap" aria-label={copy.horizonLabel}>
                  {HORIZONS.map((h) => (
                    <ToggleGroupItem key={h.value} value={h.value} variant="outline" className="data-[state=on]:bg-primary data-[state=on]:text-white">
                      {h.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </fieldset>
              <div className="space-y-3">
                <Label htmlFor="benchmark" className="text-ink text-sm font-semibold">
                  {copy.benchmarkLabel}
                </Label>
                <p className="text-muted-foreground text-sm">{copy.benchmarkWhy}</p>
                <Select value={benchmarkId} onValueChange={setBenchmarkId}>
                  <SelectTrigger id="benchmark" className="w-full max-w-sm bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {benchmarks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <StickyBar>
              <Button variant="ghost" onClick={() => setStep('review')}>
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
              <Button size="cta" onClick={submit} disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {copy.submitLabel}
              </Button>
            </StickyBar>
          </div>
        )}

        {step === 'results' && view && <Results view={view} copy={copy} signedIn={signedIn} demoMode={demoMode} onRestart={restart} onView={setView} />}
      </div>

      <Sheet open={pasteOpen} onOpenChange={setPasteOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-2xl rounded-t-3xl p-6">
          <SheetHeader className="p-0">
            <SheetTitle>{copy.pasteLabel}</SheetTitle>
            <SheetDescription>{copy.pasteHelp}</SheetDescription>
          </SheetHeader>
          <Textarea
            aria-label={copy.pasteLabel}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={8}
            className="mt-4 font-mono text-sm"
            placeholder={'Parag Parikh Flexi Cap Fund Direct Growth\t1234.56\nINF846K01WO1\t50'}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPasteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={paste} disabled={!pasteText.trim() || pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Add rows
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/** The step's main action: inline on desktop, pinned to the bottom on phones. */
function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper/95 sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 lg:col-span-2">
      {children}
    </div>
  )
}

