import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'How we use AI', description: 'Where Bees Copilot uses AI, what it does not do, and how every answer is reviewed.' }

// Regulated content: needs BASL / compliance approval before release (see CLAUDE.md).
const sections = [
  {
    title: 'What the AI does',
    items: [
      'Explains your own numbers in plain words: holdings, goals, costs and what changed this week.',
      'Prepares drafts, such as a rebalance or a tax-loss suggestion, for you to read and approve.',
      'Summarises a document you upload and shows where each point comes from.',
    ],
  },
  {
    title: 'What the AI does not do',
    items: [
      'It never places an order. Nothing happens until you approve, and orders go through your own account.',
      'It does not guarantee returns, give stock tips or promise performance.',
      'It does not calculate your figures. Net worth, returns, risk scores, drift and tax estimates come from tested software; the AI only reads and explains them.',
    ],
  },
  {
    title: 'Your data',
    items: [
      'Each question is answered only from the signed-in family’s own data, never another client’s.',
      'Client data is stored in India. Our vendor contracts bar training models on client data.',
      'Every AI answer is saved with the time and version so our compliance team can review it.',
    ],
  },
  {
    title: 'Human oversight',
    items: [
      'Questions that sound like advice are passed to your adviser, who is a SEBI-registered person.',
      'When the Copilot is not confident in an answer, it hands over to your adviser.',
      'Our rules engine checks every suggestion against your risk profile before you see it.',
    ],
  },
] as const

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
