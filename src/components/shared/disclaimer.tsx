import { cn } from '@/lib/utils'

/** Regulatory fine print. Renders nothing when the CMS field is empty. */
export function Disclaimer({ children, className }: { children?: string | null; className?: string }) {
  if (!children?.trim()) return null
  return (
    <p className={cn('text-muted-foreground text-xs leading-relaxed', className)} data-disclaimer>
      {children}
    </p>
  )
}
