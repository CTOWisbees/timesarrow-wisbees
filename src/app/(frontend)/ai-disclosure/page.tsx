import type { Metadata } from 'next'
import Link from 'next/link'

import { sections } from '@/lib/content/ai-disclosure'

export const metadata: Metadata = { title: 'How we use AI', description: 'Where Bees Copilot uses AI, what it does not do, and how every answer is reviewed.' }


export default function AiDisclosurePage() {
  return (
    <>
      <div className="from-mint to-paper border-b bg-gradient-to-b">
        <div className="container-page py-10 md:py-16">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">How we use AI</h1>
          <p className="text-ink-soft mt-4 max-w-2xl text-lg">Bees Copilot is an AI assistant. It prepares and explains; you and your adviser decide.</p>
        </div>
      </div>
      <div className="container-page grid gap-5 py-10 md:grid-cols-2 md:py-14">
        {sections.map((s) => (
          <section key={s.title} className="bg-card rounded-3xl border p-6 shadow-[0_2px_12px_rgb(16_34_27/0.05)]">
            <h2 className="text-2xl font-semibold">{s.title}</h2>
            <ul className="text-ink-soft mt-4 flex list-disc flex-col gap-2.5 pl-5">
              {s.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-muted-foreground text-sm md:col-span-2">
          Questions about your data or a complaint about an AI answer? Write to us through <Link href="/sebi-disclosure" className="text-primary underline underline-offset-2">our SEBI disclosure page</Link>, where
          the complaint process and officers are listed.
        </p>
      </div>
    </>
  )
}
