'use client'

import { track } from '@vercel/analytics'
import { Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatInr } from '@/lib/format-inr'
import type { ScanView } from '@/lib/portfolio/entitlements'
import { cn } from '@/lib/utils'

import { completePayment, refreshView, startUpgrade } from './actions'
import type { ScanCopy } from './shared'

type RazorpayOptions = {
  key: string
  amount: number
  currency: 'INR'
  name: string
  order_id: string
  handler: (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void
  modal?: { ondismiss?: () => void }
  theme?: { color?: string }
}
declare global {
  interface Window {
    Razorpay?: new (o: RazorpayOptions) => { open: () => void }
  }
}

/** Razorpay's checkout script is loaded only when someone chooses to pay, never on page load. */
function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

type Props = {
  copy: ScanCopy
  open: 'insights' | 'pro' | null
  onOpenChange: (open: boolean) => void
  signedIn: boolean
  portfolioId: string
  onView: (v: ScanView) => void
}

export function PlanSheet({ copy, open, onOpenChange, signedIn, portfolioId, onView }: Props) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) track('plan_sheet_viewed', { plan: open })
  }, [open])

  const finish = async (plan: string) => {
    track('purchase_completed', { plan })
    const res = await refreshView(portfolioId)
    if (res.ok) onView(res.view)
    onOpenChange(false)
    requestAnimationFrame(() => document.getElementById('insights-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const buy = (plan: 'insights' | 'pro') =>
    start(async () => {
      setMessage(null)
      const res = await startUpgrade(plan)
      if (!res.ok) {
        setMessage(res.error === 'billing_unavailable' ? 'Payments are not switched on yet. Please check back soon.' : 'Something went wrong. Try again in a moment.')
        return
      }
      if (res.mode === 'granted') return finish(plan)
      if (!(await loadCheckout()) || !window.Razorpay) return setMessage('Could not open the payment window. Check your connection and try again.')
      new window.Razorpay({
        key: res.keyId,
        amount: res.amount,
        currency: 'INR',
        name: `WisBees ${res.name}`,
        order_id: res.orderId,
        theme: { color: '#0f6b4c' },
        handler: (r) =>
          start(async () => {
            const done = await completePayment(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature)
            if (done.ok) await finish(plan)
            else setMessage('We could not confirm the payment. If money left your account, it will be refunded or the plan switched on shortly.')
          }),
      }).open()
    })

  return (
    <Sheet open={open !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-xl">
        <SheetHeader className="p-0">
          <SheetTitle className="font-heading text-2xl">{copy.plansTitle}</SheetTitle>
          <SheetDescription>{copy.plansIntro}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 grid gap-4">
          {copy.plans?.map((p) => (
            <section key={p.id ?? p.planId} className={cn('rounded-2xl border p-5', open === p.planId && 'border-primary ring-primary/20 ring-2')}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-sans text-lg font-semibold">{p.name}</h3>
                <p className="text-ink tabular-nums">
                  <span className="font-heading text-2xl font-semibold">{formatInr(p.pricePaise / 100)}</span>{' '}
                  <span className="text-muted-foreground text-sm">{p.period}</span>
                </p>
              </div>
              <ul className="text-ink-soft mt-4 space-y-2 text-sm">
                {p.features?.map((f) => (
                  <li key={f.id ?? f.text} className="flex gap-2">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {signedIn ? (
                  <Button className="w-full" onClick={() => buy(p.planId)} disabled={pending} variant={open === p.planId ? 'default' : 'outline'}>
                    {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    {p.cta}
                  </Button>
                ) : (
                  <Button asChild className="w-full" variant={open === p.planId ? 'default' : 'outline'}>
                    <Link href="/login?next=/portfolio">{copy.savePrompt.cta}</Link>
                  </Button>
                )}
              </div>
            </section>
          ))}
        </div>
        {message && <p className="text-destructive mt-4 text-sm">{message}</p>}
        <p className="text-muted-foreground mt-5 text-xs leading-relaxed">{copy.refundLine}</p>
      </SheetContent>
    </Sheet>
  )
}
