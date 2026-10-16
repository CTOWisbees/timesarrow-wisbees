'use client'

import { AlertCircle, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatInr } from '@/lib/format-inr'
import { parseAmount } from '@/lib/portfolio/numbers'
import { cn } from '@/lib/utils'

import { planLabel } from './holding-search'
import { needsValue, type Row, rowValue } from './rows'
import { type ScanCopy, TYPE_LABELS } from './shared'

/** A number box that accepts "1,24,500" or "₹2.5" and keeps the raw text while typing. */
function AmountInput({ value, onChange, label, placeholder, decimals = 2 }: { value: number | null; onChange: (v: number | null) => void; label: string; placeholder?: string; decimals?: number }) {
  const [text, setText] = useState(value === null ? '' : String(value))
  const [focused, setFocused] = useState(false)
  const shown = focused ? text : value === null ? '' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: decimals }).format(value)
  return (
    <Input
      aria-label={label}
      inputMode="decimal"
      placeholder={placeholder}
      className="h-10 text-right tabular-nums"
      value={shown}
      onFocus={() => {
        setText(value === null ? '' : String(value))
        setFocused(true)
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        setText(e.target.value)
        const n = parseAmount(e.target.value)
        onChange(n !== null && n > 0 ? n : null)
      }}
    />
  )
}

type Props = {
  rows: Row[]
  copy: ScanCopy
  mode: 'edit' | 'review'
  onChange: (uid: string, patch: Partial<Row>) => void
  onRemove: (uid: string) => void
  onPickSuggestion: (uid: string, key: string) => void
}

export function HoldingsTable({ rows, copy, mode, onChange, onRemove, onPickSuggestion }: Props) {
  const review = mode === 'review'
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border md:block">
        <table className="w-full text-sm">
          <thead className="bg-mist text-ink-soft text-left text-xs font-medium">
            <tr>
              <th className="px-4 py-3 font-medium">Instrument</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="w-36 px-3 py-3 text-right font-medium">{copy.quantityLabel}</th>
              {review && <th className="w-28 px-3 py-3 text-right font-medium">Price</th>}
              <th className="w-40 px-3 py-3 text-right font-medium">Value</th>
              {review && <th className="w-44 px-3 py-3 text-right font-medium">{copy.purchaseColumn}</th>}
              <th className="w-12 px-2 py-3">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.uid} className={cn('bg-card align-top', !r.key && r.type !== 'cash' && 'bg-amber-soft/60')}>
                <td className="px-4 py-3">
                  <Name row={r} copy={copy} onPickSuggestion={onPickSuggestion} />
                </td>
                <td className="px-3 py-3">
                  <Badge variant="secondary">{TYPE_LABELS[r.type]}</Badge>
                </td>
                <td className="px-3 py-2">
                  <AmountInput
                    label={`${copy.quantityLabel}, ${r.name}`}
                    value={r.quantity}
                    decimals={4}
                    placeholder={r.type === 'cash' ? 'Amount' : r.investedAmount ? '' : '0'}
                    onChange={(v) => onChange(r.uid, { quantity: v })}
                  />
                </td>
                {review && (
                  <td className="text-ink-soft px-3 py-3.5 text-right tabular-nums">{r.type === 'cash' ? '–' : r.price && r.type !== 'equity' ? formatInr(r.price) : 'Not available'}</td>
                )}
                <td className="px-3 py-2">
                  <ValueCell row={r} copy={copy} onChange={onChange} />
                </td>
                {review && (
                  <td className="px-3 py-2">
                    {r.type === 'cash' ? null : <AmountInput label={`${copy.purchaseColumn}, ${r.name}`} value={r.costValue} decimals={0} placeholder="Optional" onChange={(v) => onChange(r.uid, { costValue: v })} />}
                  </td>
                )}
                <td className="px-2 py-2.5">
                  <Button variant="ghost" size="icon" aria-label={`Remove ${r.name}`} onClick={() => onRemove(r.uid)}>
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.uid} className={cn('bg-card rounded-2xl border p-4', !r.key && r.type !== 'cash' && 'border-amber-line bg-amber-soft/50')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Name row={r} copy={copy} onPickSuggestion={onPickSuggestion} />
              </div>
              <Button variant="ghost" size="icon" className="-mt-1 -mr-2 shrink-0" aria-label={`Remove ${r.name}`} onClick={() => onRemove(r.uid)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-ink-soft text-xs font-medium">
                {r.type === 'cash' ? 'Amount' : copy.quantityLabel}
                <div className="mt-1">
                  <AmountInput label={`${copy.quantityLabel}, ${r.name}`} value={r.quantity} decimals={4} onChange={(v) => onChange(r.uid, { quantity: v })} />
                </div>
              </label>
              <div className="text-ink-soft text-xs font-medium">
                Value
                <div className="mt-1">
                  <ValueCell row={r} copy={copy} onChange={onChange} />
                </div>
              </div>
              {review && r.type !== 'cash' && (
                <label className="text-ink-soft col-span-2 text-xs font-medium">
                  {copy.purchaseColumn}
                  <div className="mt-1">
                    <AmountInput label={`${copy.purchaseColumn}, ${r.name}`} value={r.costValue} decimals={0} placeholder="Optional" onChange={(v) => onChange(r.uid, { costValue: v })} />
                  </div>
                </label>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Name({ row, copy, onPickSuggestion }: { row: Row; copy: ScanCopy; onPickSuggestion: Props['onPickSuggestion'] }) {
  const id = useId()
  const meta = [planLabel(row), row.subCategory, row.isin].filter(Boolean).join(' · ')
  if (!row.key && row.type !== 'cash') {
    return (
      <div className="min-w-0 space-y-2">
        <p className="text-ink flex items-center gap-1.5 font-medium">
          <AlertCircle className="text-amber-ink size-4 shrink-0" aria-hidden />
          <span className="truncate">{row.name}</span>
        </p>
        {row.suggestions.length > 0 ? (
          <Select onValueChange={(key) => onPickSuggestion(row.uid, key)}>
            <SelectTrigger id={id} aria-label={`${copy.unresolvedLabel}: ${row.name}`} className="h-9 w-full max-w-sm bg-white text-left">
              <SelectValue placeholder={copy.unresolvedLabel} />
            </SelectTrigger>
            <SelectContent>
              {row.suggestions.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.name}
                  {planLabel({ plan: s.plan as Row['plan'], option: s.option as Row['option'] }) && ` (${planLabel({ plan: s.plan as Row['plan'], option: s.option as Row['option'] })})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-ink-soft text-xs">{copy.valueHelp}</p>
        )}
      </div>
    )
  }
  return (
    <div className="min-w-0">
      <p className="text-ink truncate font-medium">{row.name}</p>
      {meta && <p className="text-muted-foreground truncate text-xs">{meta}</p>}
    </div>
  )
}

function ValueCell({ row, copy, onChange }: { row: Row; copy: ScanCopy; onChange: Props['onChange'] }) {
  if (needsValue(row)) {
    return <AmountInput label={`${copy.valueLabel}, ${row.name}`} value={row.currentValue} decimals={0} placeholder={copy.valueLabel ?? ''} onChange={(v) => onChange(row.uid, { currentValue: v })} />
  }
  const v = rowValue(row)
  return (
    <p className="text-ink py-2.5 text-right font-medium tabular-nums">
      {v ? formatInr(v) : row.investedAmount ? `≈ ${formatInr(row.investedAmount)}` : '–'}
    </p>
  )
}
