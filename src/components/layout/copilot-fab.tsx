import { Sparkles } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * Floating "Bees Copilot" button, fixed to the bottom right like a back-to-top button.
 * The label slides out on hover or keyboard focus. Bees Copilot is not live yet, so for now
 * it opens the "coming soon" page; point `href` at the chat when it ships.
 */
export function CopilotFab({ href = '/coming-soon', raised = false }: { href?: string; /** Lift it clear of the dev-only Variants menu. */ raised?: boolean }) {
  return (
    <Link
      href={href}
      aria-label="Bees Copilot"
      className={cn(
        'group bg-primary hover:bg-brand-green-strong focus-visible:ring-ring/50 fixed right-4 z-30 flex size-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgb(15_107_76/0.35)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgb(15_107_76/0.45)] focus-visible:ring-4 focus-visible:outline-none sm:right-6',
        raised ? 'bottom-20 sm:bottom-20' : 'bottom-4 sm:bottom-6',
      )}
    >
      <Sparkles className="size-6" aria-hidden />
      <span
        aria-hidden
        className="bg-ink pointer-events-none absolute right-full mr-3 translate-x-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
      >
        Bees Copilot
      </span>
    </Link>
  )
}
