import { CheckCheck } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

export const enter = 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300'

/** The paper behind the messages: a soft green with a faint dot pattern, like a messaging app's wallpaper. */
export const wallpaper = {
  backgroundColor: '#e9efe7',
  backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(15 107 76 / 0.09) 1px, transparent 0)',
  backgroundSize: '22px 22px',
} as const

const bubble = 'relative px-4 py-2.5 text-[0.95rem] leading-relaxed shadow-[0_1px_1px_rgb(16_34_27/0.14)] before:absolute before:top-0 before:size-0 before:content-[""]'

/** A message from the WisBees adviser: a white bubble on the left with a small tail. */
export function BotMessage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-start', enter, className)}>
      <div
        className={cn(
          bubble,
          'bg-card max-w-[min(42rem,88%)] space-y-1.5 rounded-xl rounded-tl-none',
          'before:-left-2.5 before:border-t-[10px] before:border-l-[10px] before:border-t-card before:border-l-transparent',
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** The visitor's own reply: a green bubble on the right with delivered ticks. */
export function UserBubble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-end', enter, className)}>
      <p
        className={cn(
          bubble,
          'bg-primary max-w-[min(36rem,80%)] rounded-xl rounded-tr-none leading-snug break-words text-white',
          'before:-right-2.5 before:border-t-[10px] before:border-r-[10px] before:border-t-primary before:border-r-transparent',
        )}
      >
        {children}
        <CheckCheck className="ml-2 inline size-4 align-[-3px] text-white/70" aria-hidden />
      </p>
    </div>
  )
}

/** Three pulsing dots while the adviser "types". */
export function Typing() {
  return (
    <div className="flex justify-start" role="status" aria-label="WisBees is typing">
      <div
        className={cn(
          bubble,
          'bg-card flex items-center gap-1 rounded-xl rounded-tl-none py-4',
          'before:-left-2.5 before:border-t-[10px] before:border-l-[10px] before:border-t-card before:border-l-transparent',
        )}
        aria-hidden
      >
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="bg-muted-foreground/60 size-1.5 rounded-full motion-safe:animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  )
}

/** The chat window's title bar: who you are talking to, and how far along the sign-up is. */
export function ChatHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="bg-card flex items-center gap-3 border-b px-4 py-3 sm:px-6">
      <span className="bg-mint flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border" aria-hidden>
        <Image src="/brand/wisbees-mark.png" alt="" width={28} height={28} />
      </span>
      <div className="min-w-0">
        <p className="text-ink truncate text-base leading-tight font-semibold">WisBees Advisory</p>
        <p className="text-ink-soft truncate text-sm">{subtitle}</p>
      </div>
    </div>
  )
}

/**
 * The chat window: messages scroll in the middle, the reply controls are docked at the
 * bottom like a messaging app's composer. On phones the page scrolls instead and the
 * composer sticks to the bottom of the screen.
 */
export function ChatLayout({ label, messages, composer }: { label: string; messages: React.ReactNode; composer: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:min-h-0">
      <div className="flex-1 px-4 py-5 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:px-12 lg:py-6" style={wallpaper}>
        <div className="mb-4 flex justify-center">
          <span className="bg-card/90 text-ink-soft rounded-lg px-3 py-1 text-xs font-medium shadow-[0_1px_1px_rgb(16_34_27/0.1)]">Today</span>
        </div>
        <div role="log" aria-label={label} className="space-y-3">
          {messages}
        </div>
      </div>
      <div className="bg-mist sticky bottom-0 z-10 shrink-0 border-t px-4 py-3 sm:px-8 lg:static lg:px-12 lg:py-4">
        <div className="mx-auto w-full max-w-3xl">{composer}</div>
      </div>
    </div>
  )
}

/** Shown in the composer while the adviser is "typing" and there is nothing to answer yet. */
export function ComposerIdle() {
  return <div className="bg-card text-muted-foreground flex h-12 items-center rounded-full border px-5 text-sm">WisBees is typing…</div>
}

/** A tappable reply, drawn as an outlined pill. */
export const chipClass =
  'border-primary/40 text-brand-green-strong bg-card hover:bg-mint focus-visible:ring-ring/50 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none disabled:opacity-50'
