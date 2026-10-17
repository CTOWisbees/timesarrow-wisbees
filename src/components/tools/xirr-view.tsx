'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatInr } from '@/lib/format-inr'
import { xirr } from '@/lib/calculators/finance'

import { panel } from './results'

type Row = { id: number; date: string; amount: string }

const sample: Row[] = [
  { id: 1, date: '2023-01-15', amount: '-10000' },
  { id: 2, date: '2023-07-15', amount: '-10000' },
  { id: 3, date: '2024-01-15', amount: '-10000' },
  { id: 4, date: '2025-01-15', amount: '38000' },
]

const toTime = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN
}

export function XirrView() {
  const [rows, setRows] = useState<Row[]>(sample)
  const [nextId, setNextId] = useState(5)

  const parsed = useMemo(() => rows.map((r) => ({ date: toTime(r.date), amount: Number(r.amount) })), [rows])
  const complete = parsed.every((p) => Number.isFinite(p.date) && Number.isFinite(p.amount))
  const rate = useMemo(() => (complete ? xirr(parsed) : null), [parsed, complete])
  const invested = parsed.filter((p) => p.amount < 0).reduce((s, p) => s - p.amount, 0)
  const received = parsed.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0)

  const update = (id: number, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div className="flex flex-col gap-6">
      <div className={`${panel} grid gap-8 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-10`}>
        <div>
          <h2 className="text-xl font-semibold">Your cash flows</h2>
          <p className="text-muted-foreground mt-1 text-sm">Enter money you put in as a negative number, and money you got back (or today&apos;s value) as a positive number.</p>
          <ul className="mt-5 flex flex-col gap-3">
            {rows.map((r, i) => (
              <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3">
                <Input
                  type="date"
                  value={r.date}
                  onChange={(e) => update(r.id, { date: e.target.value })}
                  aria-label={`Date, cash flow ${i + 1}`}
                  className="h-11 bg-card"
                />
                <Input
                  inputMode="decimal"
                  value={r.amount}
                  onChange={(e) => update(r.id, { amount: e.target.value.replace(/[^\d.-]/g, '') })}
                  aria-label={`Amount in rupees, cash flow ${i + 1}`}
                  placeholder="-10000"
                  className="h-11 bg-card tabular-nums"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={rows.length <= 2}
                  onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                  aria-label={`Remove cash flow ${i + 1}`}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setRows((prev) => [...prev, { id: nextId, date: '', amount: '' }])
              setNextId((n) => n + 1)
            }}
          >
            <Plus /> Add cash flow
          </Button>
        </div>

        <div className="md:border-l md:pl-10">
          <div className="bg-primary rounded-xl p-5 text-white">
            <p className="text-sm text-white/80">XIRR (annualised return)</p>
            <p className="font-heading mt-1 text-4xl font-semibold tabular-nums">{rate === null ? '—' : `${(Math.floor(rate * 10000) / 100).toFixed(2)}%`}</p>
          </div>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="bg-mist rounded-xl border p-4">
              <dt className="text-ink-soft text-sm">Total invested</dt>
              <dd className="font-heading text-ink mt-1 text-xl font-semibold tabular-nums">{formatInr(invested)}</dd>
            </div>
            <div className="bg-mist rounded-xl border p-4">
              <dt className="text-ink-soft text-sm">Total received</dt>
              <dd className="font-heading text-ink mt-1 text-xl font-semibold tabular-nums">{formatInr(received)}</dd>
            </div>
          </dl>
          {!complete && <p className="text-ink-soft mt-4 text-sm">Fill in a date and an amount for every row.</p>}
          {complete && rate === null && <p className="text-ink-soft mt-4 text-sm">Add at least one outflow (negative) and one inflow (positive) to get a rate.</p>}
        </div>
      </div>
    </div>
  )
}
