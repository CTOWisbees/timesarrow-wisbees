import Image from 'next/image'

import { cn } from '@/lib/utils'

export const enter = 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300'

/** A message from the WisBees adviser: round logo and a white bubble. */
export function BotMessage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3', enter, className)}>
      <span className="bg-card mt-0.5 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border" aria-hidden>
        <Image src="/brand/wisbees-mark.png" alt="" width={22} height={22} />
      </span>
      <div className="bg-card max-w-[min(34rem,92%)] space-y-1.5 rounded-2xl rounded-tl-md border px-4 py-3 text-[0.95rem] leading-relaxed shadow-[0_1px_2px_rgb(16_34_27/0.04)]">
        {children}
      </div>
    </div>
  )
}

/** The visitor's own reply. */
export function UserBubble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-end', enter, className)}>
      <p className="bg-primary max-w-[85%] rounded-2xl rounded-tr-md px-4 py-2.5 text-[0.95rem] leading-snug break-words text-white">{children}</p>
    </div>
  )
}

/** Three pulsing dots while the adviser "types". */
export function Typing() {
  return (
    <div className="flex items-start gap-3" role="status" aria-label="WisBees is typing">
      <span className="bg-card flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border" aria-hidden>
        <Image src="/brand/wisbees-mark.png" alt="" width={22} height={22} />
      </span>
      <div className="bg-card flex items-center gap-1 rounded-2xl rounded-tl-md border px-4 py-4" aria-hidden>
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="bg-muted-foreground/60 size-1.5 rounded-full motion-safe:animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  )
}

/** A tappable reply, drawn as an outlined pill. */
export const chipClass =
  'border-primary/40 text-brand-green-strong bg-card hover:bg-mint focus-visible:ring-ring/50 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none disabled:opacity-50'
