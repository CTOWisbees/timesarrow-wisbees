'use client'

import { Layers } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SECTION_TOGGLES, SECTION_VARIANTS, type SectionKey, toggleParam, variantParam } from '@/lib/section-variants'

type ToggleSection = keyof typeof SECTION_TOGGLES
const hasToggles = (s: SectionKey): s is ToggleSection => s in SECTION_TOGGLES

/**
 * DEVELOPMENT ONLY (rendered when `variantPreviewEnabled()`): switch any section to
 * another design to compare with the team. Changes only the URL, so a link to a
 * variant can be shared; the live choice stays in the CMS.
 */
export function VariantSwitcher({
  sections,
  live,
  toggles = {},
}: {
  /** Sections on the current page. */
  sections: SectionKey[]
  live: Partial<Record<SectionKey, string | null | undefined>>
  /** Live (CMS) values of each section's presentation switches, e.g. which fields show icons. */
  toggles?: Partial<Record<ToggleSection, readonly string[] | null>>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current = (section: SectionKey) =>
    searchParams.get(variantParam(section)) ?? live[section] ?? SECTION_VARIANTS[section].variants[0].value
  const overridden = sections.filter(
    (s) =>
      (searchParams.has(variantParam(s)) && searchParams.get(variantParam(s)) !== live[s]) ||
      (hasToggles(s) && searchParams.has(toggleParam(s))),
  )

  // Quick successive clicks must build on the previous change, not on a URL that has
  // not updated yet, so the last requested query is kept until the router catches up.
  const pending = useRef<string | null>(null)
  useEffect(() => {
    if (pending.current === searchParams.toString()) pending.current = null
  }, [searchParams])
  const base = () => new URLSearchParams(pending.current ?? searchParams.toString())

  const replace = (next: URLSearchParams) => {
    const query = next.toString()
    pending.current = query
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }

  /** Current toggle values: the URL preview if set ("none" = all off), else the CMS value. */
  const currentToggles = (section: ToggleSection, params: Pick<URLSearchParams, 'get'> = searchParams) => {
    const preview = params.get(toggleParam(section))
    return preview !== null ? preview.split(',').filter((v) => v && v !== 'none') : [...(toggles[section] ?? [])]
  }

  const flip = (section: ToggleSection, value: string, on: boolean) => {
    const next = base()
    const set = new Set(currentToggles(section, next))
    if (on) set.add(value)
    else set.delete(value)
    const liveSet = [...(toggles[section] ?? [])].sort().join(',')
    const chosen = [...set].sort().join(',')
    if (chosen === liveSet) next.delete(toggleParam(section))
    else next.set(toggleParam(section), chosen || 'none')
    replace(next)
  }

  const select = (section: SectionKey, value: string) => {
    const next = base()
    if (value === live[section]) next.delete(variantParam(section))
    else next.set(variantParam(section), value)
    replace(next)
    // Bring the section into view, below the sticky header, so the change is visible at once.
    setTimeout(() => {
      const el = document.getElementById(SECTION_VARIANTS[section].anchor)
      const header = document.querySelector('header')?.getBoundingClientRect().height ?? 0
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - header, behavior: 'instant' })
    }, 150)
  }

  const reset = () => {
    const next = base()
    sections.forEach((s) => {
      next.delete(variantParam(s))
      if (hasToggles(s)) next.delete(toggleParam(s))
    })
    replace(next)
  }

  // Raised on phones so it never covers a section's own bottom controls.
  return (
    <div className="fixed right-4 bottom-28 z-50 sm:bottom-4">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="bg-ink h-9 gap-2 rounded-full px-3.5 text-white shadow-[0_6px_20px_rgb(16_34_27/0.3)] hover:bg-ink/90">
            <Layers className="size-4" aria-hidden />
            Variants
            {overridden.length > 0 && (
              <span className="bg-amber text-ink rounded-full px-1.5 text-[0.7rem] font-semibold">{overridden.length}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={8} className="max-h-[min(36rem,80svh)] w-80 overflow-y-auto p-1.5">
          <DropdownMenuLabel className="text-muted-foreground px-2 text-xs font-normal">
            Dev preview only. Pick the live design in the CMS.
          </DropdownMenuLabel>
          {sections.map((section) => (
            <DropdownMenuGroup key={section}>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="px-2 text-sm">{SECTION_VARIANTS[section].label}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={current(section)} onValueChange={(v) => select(section, v)}>
                {SECTION_VARIANTS[section].variants.map((v) => (
                  <DropdownMenuRadioItem key={v.value} value={v.value} className="items-start py-2">
                    <span>
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {v.label}
                        {v.value === live[section] && (
                          <span className="bg-mint text-brand-green-strong rounded px-1.5 text-[0.65rem] font-semibold uppercase">
                            Live
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground block text-xs">{v.hint}</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {hasToggles(section) && (
                <>
                  <DropdownMenuLabel className="text-muted-foreground px-2 pt-2 text-xs font-medium">
                    {SECTION_TOGGLES[section].label}
                  </DropdownMenuLabel>
                  <div className="grid grid-cols-2">
                    {SECTION_TOGGLES[section].options.map((o) => (
                      <DropdownMenuCheckboxItem
                        key={o.value}
                        checked={currentToggles(section).includes(o.value)}
                        onCheckedChange={(on) => flip(section, o.value, on === true)}
                        // Keep the menu open while switching several icons.
                        onSelect={(e) => e.preventDefault()}
                        className="text-sm"
                      >
                        {o.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </>
              )}
            </DropdownMenuGroup>
          ))}
          {overridden.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={reset} className="justify-center text-sm font-medium">
                Back to live designs
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
