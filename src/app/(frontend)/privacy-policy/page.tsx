import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy policy', description: 'What WisBees collects, why, where it is kept, and the choices you have.' }

// Regulated content: needs BASL / compliance and legal approval before release (see CLAUDE.md).
const sections = [
  {
    title: 'What we collect',
    items: [
      'Account details you give us: name, email, phone number and the answers to your risk questions.',
      'Holdings you add to Port Scan, by upload, search or paste: instrument names, quantities, values and, if you give it, what you paid. We do not ask for your PAN or folio numbers in the free Port Scan.',
      'Goals, answers to suggestions, messages and complaints you create in the dashboard.',
      'Basic technical data needed to keep the service secure, such as device and sign-in events.',
    ],
  },
  {
    title: 'Why we use it',
    items: [
      'To score your portfolio, show your money, goals and suggestions, and let your adviser prepare advice for you.',
      'To meet our duties as a SEBI-registered Investment Adviser, including keeping records of advice and of what the AI told you.',
      'We do not sell your data and we take no commission from any product, so we have no reason to share it for marketing.',
    ],
  },
  {
    title: 'Consent',
    items: [
      'Each data source has its own consent, which you give when you connect it and can withdraw at any time in Privacy and Permissions.',
      'We contact you only about your account, your advice and what you asked for.',
    ],
  },
  {
    title: 'Where it is kept and who sees it',
    items: [
      'Client data is stored in India and encrypted in transit and at rest.',
      'Only you, your adviser and the compliance team see your data. Each question to the Copilot is answered only from the signed-in family’s own data.',
      'Our service providers process data only on our instructions, and our contracts bar them from training models on client data.',
    ],
  },
  {
    title: 'How long we keep it',
    items: [
      'Portfolios you add for a free Port Scan are kept until you delete them; a check made without signing in expires after 24 hours.',
      'Records we must keep by law, such as advice, agreements, complaints and the log of AI answers, are kept for the period the law requires, even if you delete your account.',
    ],
  },
  {
    title: 'Your choices',
    items: [
      'Download everything we hold about you, and delete your portfolios, goals and answers, from Privacy and Permissions in the dashboard.',
      'Withdraw any consent, or ask us to correct your details, by writing to us or raising a ticket in Help and Complaints.',
      'If you are not satisfied, you can complain to us and, through the SCORES portal, to SEBI.',
    ],
  },
] as const

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className="from-mint to-paper border-b bg-gradient-to-b">
        <div className="container-page py-10 md:py-16">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Privacy policy</h1>
          <p className="text-ink-soft mt-4 max-w-2xl text-lg">What we collect, why we use it, where it is kept, and the choices you have. Your financial data is yours.</p>
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
          See also <Link href="/ai-disclosure" className="text-primary underline underline-offset-2">how we use AI</Link> and our{' '}
          <Link href="/sebi-disclosure" className="text-primary underline underline-offset-2">SEBI disclosures</Link>, where the complaint process and officers are listed.
        </p>
      </div>
    </>
  )
}
