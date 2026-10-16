'use client'

import { Bell, CheckCircle2, Download, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Plan, ScanView } from '@/lib/portfolio/entitlements'
import type { Alert, Preferences } from '@/lib/portfolio/server/store'

import { deleteAllMyData, demoSetPlan, demoSignIn, readAlerts, removePortfolio, renameMyPortfolio, updatePreferences } from './actions'
import { Results } from './results'
import { fill, type ScanCopy } from './shared'

type Props = {
  copy: ScanCopy
  view: ScanView
  portfolios: { id: string; name: string; updatedAt: string; score: number | null; band: string | null }[]
  currentId: string
  name: string
  history: { date: string; score: number; band: string }[]
  prefs: Preferences
  alerts: Alert[]
  plan: Plan
  justSaved: boolean
  demoMode: boolean
}

const PLAN_LABEL: Record<Plan, string> = { anonymous: 'Free', free: 'Free', insights: 'Insights', pro: 'Pro' }
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const trendConfig = { score: { label: 'Score', color: '#0f8a55' } } satisfies ChartConfig

export function Dashboard({ copy, view: initialView, portfolios, currentId, name, history, prefs: initialPrefs, alerts, plan, justSaved, demoMode }: Props) {
  const router = useRouter()
  const [view, setView] = useState(initialView)
  const [prefs, setPrefs] = useState(initialPrefs)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, start] = useTransition()
  const unread = alerts.filter((a) => !a.read).length

  const savePrefs = (next: Preferences) => {
    setPrefs(next)
    start(async () => void (await updatePreferences(next)))
  }

  const alertText = (a: Alert) => {
    const t = copy.alertTemplates
    const p = a.payload as Record<string, string | number>
    if (a.kind === 'score_drop') return fill(t.scoreDrop, p)
    if (a.kind === 'new_flag') return fill(t.newFlag, { title: fill(copy.flags?.find((f) => f.rule === p.rule)?.title ?? String(p.rule), p) })
    if (a.kind === 'limit_crossed') return fill(t.limitCrossed, p)
    return t.recheckDue
  }

  return (
    <div className="container-page py-8 md:py-12">
      {justSaved && (
        <p className="bg-mint/70 text-ink mb-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="text-primary size-4" aria-hidden />
          {copy.savedBanner}
        </p>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-ink-soft flex items-center gap-2 text-sm">
            {copy.dashboardTitle}
            <Badge variant={plan === 'pro' || plan === 'insights' ? 'default' : 'secondary'}>{PLAN_LABEL[plan]}</Badge>
          </p>
          {editing ? (
            <form
              className="mt-1 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                setEditing(false)
                start(async () => void (await renameMyPortfolio(currentId, title)))
              }}
            >
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 max-w-xs" aria-label="Portfolio name" autoFocus maxLength={80} />
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>
          ) : (
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {title}
              <Button variant="ghost" size="icon" aria-label="Rename portfolio" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
              </Button>
            </h1>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {portfolios.length > 1 && (
            <Select value={currentId} onValueChange={(id) => router.push(`/portfolio?id=${id}`)}>
              <SelectTrigger className="w-56 bg-white" aria-label="Switch portfolio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.score !== null && `· ${p.score}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button asChild>
            <Link href="/portfolio-scan">
              <Plus className="size-4" aria-hidden />
              {copy.newCheckLabel}
            </Link>
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="bg-card min-w-0 rounded-3xl border p-5 sm:p-7" aria-labelledby="trend-title">
          <h2 id="trend-title" className="mb-4 font-sans text-base font-semibold">
            {copy.trendTitle}
          </h2>
          {history.length < 2 ? (
            <div className="flex flex-col items-start gap-1">
              <p className="font-heading text-ink text-4xl font-semibold tabular-nums">{history[0]?.score ?? view.score.score}</p>
              <p className="text-muted-foreground text-sm">{history[0] ? dateFmt.format(new Date(history[0].date)) : ''}</p>
              <p className="text-ink-soft mt-3 text-sm">{copy.trendEmpty}</p>
            </div>
          ) : (
            <ChartContainer config={trendConfig} className="aspect-auto h-48 w-full">
              <LineChart data={history} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={32} tickFormatter={(d) => dateFmt.format(new Date(d))} className="text-xs" />
                <YAxis domain={[0, 100]} ticks={[0, 40, 60, 80, 100]} tickLine={false} axisLine={false} width={32} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as (typeof history)[number] | undefined
                    if (!active || !p) return null
                    return (
                      <div className="bg-card rounded-lg border px-3 py-2 text-xs shadow-md">
                        <p className="text-muted-foreground">{dateFmt.format(new Date(p.date))}</p>
                        <p className="text-ink font-semibold">Score {p.score}</p>
                      </div>
                    )
                  }}
                />
                <Line dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: 'var(--card)' }} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
          )}
        </section>

        <section className="bg-card min-w-0 rounded-3xl border p-5 sm:p-7" aria-labelledby="alerts-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="alerts-title" className="flex items-center gap-2 font-sans text-base font-semibold">
              <Bell className="size-4" aria-hidden />
              {copy.alertsTitle}
              {unread > 0 && <Badge>{unread}</Badge>}
            </h2>
            {unread > 0 && (
              <Button variant="link" className="h-auto p-0 text-sm" onClick={() => start(async () => (await readAlerts(), router.refresh()))}>
                Mark as read
              </Button>
            )}
          </div>
          {alerts.length ? (
            <ul className="divide-y text-sm">
              {alerts.slice(0, 6).map((a) => (
                <li key={a.id} className="flex gap-3 py-2.5">
                  <span aria-hidden className={a.read ? 'bg-border mt-1.5 size-2 shrink-0 rounded-full' : 'bg-primary mt-1.5 size-2 shrink-0 rounded-full'} />
                  <span className="min-w-0">
                    <span className="text-ink block">{alertText(a)}</span>
                    <span className="text-muted-foreground text-xs">{dateFmt.format(new Date(a.createdAt))}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-soft text-sm">{copy.alertsEmpty}</p>
          )}

          <div className="mt-6 space-y-4 border-t pt-5">
            <div className="flex items-start gap-3">
              <Checkbox id="recheck" checked={prefs.recheckReminder} onCheckedChange={(v) => savePrefs({ ...prefs, recheckReminder: v === true })} />
              <div>
                <Label htmlFor="recheck" className="text-ink font-medium">
                  {copy.reminderLabel}
                </Label>
                <p className="text-muted-foreground mt-0.5 text-xs">{copy.reminderHelp}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Label htmlFor="drop" className="text-ink-soft font-normal">
                {copy.alertDropLabel}
              </Label>
              <Input
                id="drop"
                inputMode="numeric"
                className="h-9 w-16 text-right"
                value={prefs.alertScoreDrop}
                onChange={(e) => setPrefs({ ...prefs, alertScoreDrop: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
                onBlur={() => savePrefs(prefs)}
              />
              <span className="text-ink-soft">points</span>
            </div>
            {plan === 'pro' && (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Label htmlFor="limit" className="text-ink-soft font-normal">
                  {copy.concentrationLabel}
                </Label>
                <Input
                  id="limit"
                  inputMode="numeric"
                  className="h-9 w-16 text-right"
                  placeholder="–"
                  value={prefs.concentrationLimit === null ? '' : Math.round(prefs.concentrationLimit * 100)}
                  onChange={(e) => setPrefs({ ...prefs, concentrationLimit: e.target.value ? Math.max(1, Math.min(100, Number(e.target.value) || 1)) / 100 : null })}
                  onBlur={() => savePrefs(prefs)}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      <Results view={view} copy={copy} signedIn demoMode={false} onRestart={() => router.push('/portfolio-scan')} onView={setView} />

      <section className="mt-12 border-t pt-8" aria-labelledby="data-title">
        <h2 id="data-title" className="font-sans text-base font-semibold">
          {copy.dataTitle}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="/api/portfolio/my-data" download>
              <Download className="size-4" aria-hidden />
              {copy.downloadLabel}
            </a>
          </Button>
          {portfolios.length > 1 && (
            <Button variant="outline" onClick={() => start(async () => (await removePortfolio(currentId), router.push('/portfolio')))}>
              <Trash2 className="size-4" aria-hidden />
              Delete this portfolio
            </Button>
          )}
          <Button variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden />
            {copy.deleteLabel}
          </Button>
        </div>
        {confirmDelete && (
          <div className="border-destructive/30 bg-destructive/5 mt-4 max-w-xl rounded-2xl border p-4 text-sm">
            <p className="text-ink">{copy.deleteConfirm}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="destructive" disabled={pending} onClick={() => start(async () => (await deleteAllMyData(), router.push('/portfolio-scan')))}>
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Delete everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      {demoMode && (
        <section className="bg-amber-soft border-amber-line mt-8 rounded-2xl border p-4 text-sm">
          <p className="text-amber-ink font-semibold">Demo mode: switch plan</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['free', 'insights', 'pro'] as const).map((p) => (
              <Button key={p} size="sm" variant={plan === p ? 'default' : 'outline'} disabled={pending} onClick={() => start(async () => (await demoSetPlan(p), router.refresh()))}>
                {PLAN_LABEL[p]}
              </Button>
            ))}
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => (await demoSignIn(false), router.push('/portfolio-scan')))}>
              Sign out test user
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
