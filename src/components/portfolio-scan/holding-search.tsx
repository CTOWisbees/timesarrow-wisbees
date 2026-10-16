'use client'

import { Loader2, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { InstrumentHit } from '@/lib/portfolio/server/instruments'
import { cn } from '@/lib/utils'

import { TYPE_LABELS } from './shared'

export const planLabel = (h: Pick<InstrumentHit, 'plan' | 'option'>) =>
  [h.plan === 'direct' ? 'Direct' : h.plan === 'regular' ? 'Regular' : null, h.option === 'growth' ? 'Growth' : h.option === 'idcw' ? 'IDCW' : null]
    .filter(Boolean)
    .join(' · ')

/**
 * Name or ISIN search with a keyboard-operable listbox (combobox pattern). Picking an
 * item fills in its type; the price comes with it.
 */
export function HoldingSearch({ label, placeholder, onPick }: { label: string; placeholder: string; onPick: (hit: InstrumentHit) => void }) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<InstrumentHit[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)
    const q = query.trim()
    if (q.length < 2) return
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/portfolio/instruments/search?q=${encodeURIComponent(q)}`)
        const body = (await res.json()) as { results?: InstrumentHit[] }
        setResults(body.results ?? [])
        setActive(0)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timer.current)
  }, [query])

  const pick = (hit: InstrumentHit) => {
    onPick(hit)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const showList = open && query.trim().length >= 2

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="text-ink mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
        <Input
          id={`${id}-input`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          className="h-12 pl-10 text-base"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.trim().length < 2) setOpen(false)
          }}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!showList || !results.length) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => (a + 1) % results.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => (a - 1 + results.length) % results.length)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              pick(results[active])
            } else if (e.key === 'Escape') setOpen(false)
          }}
        />
        {loading && <Loader2 className="text-muted-foreground absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin" aria-hidden />}
      </div>
      {showList && (
        <ul id={`${id}-list`} role="listbox" className="bg-popover absolute z-30 mt-1.5 max-h-80 w-full overflow-auto rounded-xl border p-1 shadow-lg">
          {results.length === 0 && !loading && <li className="text-muted-foreground px-3 py-2.5 text-sm">No match. Check the spelling, or try the ISIN.</li>}
          {results.map((hit, i) => (
            <li
              key={hit.key}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(hit)}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2.5', i === active && 'bg-mint/60')}
            >
              <span className="min-w-0">
                <span className="text-ink block truncate text-sm font-medium">{hit.name}</span>
                <span className="text-muted-foreground block truncate text-xs">
                  {[planLabel(hit), hit.subCategory, hit.isin].filter(Boolean).join(' · ')}
                </span>
              </span>
              <Badge variant="secondary" className="shrink-0">
                {TYPE_LABELS[hit.type]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

