import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type SectionProps = ComponentProps<'section'> & {
  tone?: 'paper' | 'white' | 'mist'
  /** Skip the page container, for full-bleed sections. */
  bleed?: boolean
}

const tones = { paper: 'bg-paper', white: 'bg-card', mist: 'bg-mist' }

export function Section({ tone = 'paper', bleed, className, children, ...props }: SectionProps) {
  return (
    <section className={cn(tones[tone], 'py-16 md:py-24', className)} {...props}>
      {bleed ? children : <div className="container-page">{children}</div>}
    </section>
  )
}

export function Eyebrow({ children, className }: { children?: string | null; className?: string }) {
  if (!children) return null
  return (
    <p className={cn('text-primary text-xs font-semibold tracking-[0.14em] uppercase', className)}>
      {children}
    </p>
  )
}

/** Headline copy from the CMS: line breaks typed by editors become line breaks on the page. */
export function Lines({ text }: { text?: string | null }) {
  const lines = (text ?? '').split('\n').filter(Boolean)
  return lines.map((line, i) => (
    <span key={i} className="block">
      {line}
    </span>
  ))
}
