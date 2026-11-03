import { cn } from '@/lib/utils'

/**
 * The Bees Copilot mark: a chat bubble holding a honeycomb cell, with a small spark for the AI. Drawn in
 * currentColor for the bubble so it sits on any background; the spark keeps the brand amber.
 */
export function BeesMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('shrink-0', className)} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} fill="none">
      <path
        d="M24 5C13.5 5 6 12 6 21.2c0 5 2.3 9.2 6.1 12.1-.3 3.2-1.5 6-3.6 8.2a.8.8 0 0 0 .7 1.3c4.4-.4 8-2 10.4-3.9 1.4.3 2.9.4 4.4.4 10.5 0 18-7 18-16.1S34.5 5 24 5Z"
        fill="currentColor"
      />
      <path d="M24 12.8 31 16.9v8.2L24 29.2l-7-4.1v-8.2l7-4.1Z" className="fill-primary" fillOpacity="0.14" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 17.6 27 19.4v3.6l-3 1.8-3-1.8v-3.6l3-1.8Z" className="fill-primary" />
      <path d="M38.5 3.5c.5 2.6 1.6 3.7 4.2 4.2-2.6.5-3.7 1.6-4.2 4.2-.5-2.6-1.6-3.7-4.2-4.2 2.6-.5 3.7-1.6 4.2-4.2Z" fill="var(--brand-amber)" />
    </svg>
  )
}
