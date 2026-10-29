'use client'

import { Download, FileText, Lock } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'

import { tiers } from '@/lib/portal/data'
import { feeCheck, FEE_CAP_PER_YEAR } from '@/lib/portal/math'
import { cn } from '@/lib/utils'

import { deleteMyDashboardData } from '../actions'
import { usePortal } from '../state'
import { btn, Card, CardHead, Disclaimer, EmptyState, lakh, PageHead, Pill, Row } from '../ui'

export function Account({ screen }: { screen: 'documents' | 'family' | 'plan' | 'privacy' }) {
  return screen === 'documents' ? <Documents /> : screen === 'family' ? <Family /> : screen === 'plan' ? <Plan /> : <Privacy />
}

function Documents() {
  return (
    <>
      <PageHead title="My Documents" sub="Everything in one safe place." />
      <EmptyState
        title="No documents yet"
        body="Your advisory agreement, risk and suitability report, call summaries and capital gains reports are filed here once you subscribe to an advisory plan. Your Port Scan report can be downloaded from your Port Scan results."
        href="/portfolio"
        cta="Open my Port Scan"
      />
      <Card flat>
        <Row icon={<FileText className="size-5" aria-hidden />} title="Port Scan PDF report" sub="From your latest portfolio check, with a paid Port Scan plan" right={<Download className="text-muted-foreground size-4" aria-hidden />} href="/portfolio" />
      </Card>
      <p className="text-muted-foreground text-sm">Documents are stored in India and encrypted, and kept for the time the law requires.</p>
    </>
  )
}

function Family() {
  const { name, data } = usePortal()
  return (
    <>
      <PageHead title="My Family" sub="See everyone's money together. Each person controls what they share." />
      <Card>
        <div className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full font-bold">{name.charAt(0)}</span>
          <div>
            <b>{name}</b>
            <div className="text-muted-foreground text-sm">You</div>
          </div>
        </div>
        <div className="font-heading text-2xl font-semibold tabular-nums">{data.hasPortfolio ? lakh(data.total) : 'No holdings added'}</div>
      </Card>
      <EmptyState title="Family view is coming" body="Soon you can invite a spouse or parent with their own login and see everyone’s money together, with each person choosing what to share. It is part of the Plus and Private plans." href="/fees" cta="See plans" />
    </>
  )
}

function Plan() {
  const { data } = usePortal()
  const paid = data.planLabel !== 'Free plan' && data.planLabel !== 'Example plan'
  return (
    <>
      <PageHead title="Plan and Billing" sub="Your plan and what each advisory plan costs." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Your plan" right={<Pill tone="good">Active</Pill>} />
          <div className="font-heading text-4xl font-semibold">{data.planLabel.replace(' plan', '')}</div>
          <p className="text-muted-foreground">{paid ? 'A paid Port Scan plan. Advisory plans are not part of it.' : 'You have the free Port Scan and calculators. Advisory plans are subscribed to with an adviser.'}</p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/portfolio" className={cn(btn.ghost, btn.sm)}>
              Port Scan plans
            </Link>
            <Link href="/#book-call" className={cn(btn.primary, btn.sm)}>
              Talk to an adviser
            </Link>
          </div>
        </Card>
        <Card>
          <CardHead title="Advisory plans" />
          {tiers
            .filter((t) => t.id !== 'free')
            .map((t) => {
              const fee = feeCheck(t.id === 'private' ? { perYear: 75_000 } : { perMonth: Number(t.price.replace(/\D/g, '')) })
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {t.price} {t.unit}
                    </div>
                  </div>
                  <Pill tone={fee.withinCap ? 'good' : 'bad'}>{fee.withinCap ? 'Within SEBI cap' : 'Over cap'}</Pill>
                </div>
              )
            })}
          <p className="text-muted-foreground text-sm">
            The fee is flat and never more than SEBI’s limit of ₹{(FEE_CAP_PER_YEAR / 100_000).toFixed(2)} lakh a year per family. See every plan on the{' '}
            <Link href="/fees" className="text-primary underline underline-offset-2">
              fees page
            </Link>
            .
          </p>
        </Card>
      </div>
      <Card>
        <CardHead title="Invoices" />
        <p className="text-muted-foreground">No invoices yet. Invoices and your fee history appear here once you subscribe to an advisory plan.</p>
      </Card>
      <Disclaimer />
    </>
  )
}

function Privacy() {
  const { data, say } = usePortal()
  const [pending, start] = useTransition()
  return (
    <>
      <PageHead title="Privacy and Permissions" sub="You decide what we can see. You can take it back any time." />
      <Card flat>
        <Row
          icon={<Lock className="size-5" aria-hidden />}
          title="Port Scan holdings"
          sub={data.hasPortfolio ? 'Shared by you when you added them. Delete them below to withdraw.' : 'Nothing shared yet'}
          right={<Pill tone={data.hasPortfolio ? 'good' : 'grey'}>{data.hasPortfolio ? 'Shared' : 'None'}</Pill>}
        />
        {['Bank accounts (Account Aggregator)', 'Mutual funds (CAMS and KFintech)', 'Broker accounts'].map((n) => (
          <Row key={n} icon={<Lock className="size-5" aria-hidden />} title={n} sub="Not linked" right={<Pill>Not linked</Pill>} />
        ))}
      </Card>
      <Card>
        <CardHead title="Your data" />
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
          <li>Stored in India and encrypted.</li>
          <li>Never used to answer another person’s questions.</li>
          <li>
            Copilot is AI. Every AI answer is saved so our compliance team can review it. Read how AI is used in our{' '}
            <Link href="/ai-disclosure" className="text-primary underline underline-offset-2">
              AI disclosure
            </Link>
            .
          </li>
          <li>Deleting your data removes your portfolios, goals and answers. Complaints and the log of AI answers are kept as compliance records.</li>
        </ul>
        <div className="flex flex-wrap gap-2.5">
          <a href="/api/portfolio/my-data" download className={cn(btn.ghost, btn.sm)}>
            <Download className="size-3.5" aria-hidden /> Download my data
          </a>
          <button
            type="button"
            disabled={pending}
            className={cn(btn.ghost, btn.sm, 'text-destructive border-destructive/40 hover:bg-destructive/10')}
            onClick={() => {
              if (!window.confirm('Delete your saved portfolios, goals and answers? This cannot be undone.')) return
              start(async () => {
                const res = await deleteMyDashboardData()
                say(res.ok ? 'Your data has been deleted.' : res.error)
              })
            }}
          >
            Delete my data
          </button>
        </div>
      </Card>
      <Card>
        <CardHead title="Sign-in" />
        <Row className="px-0" title="One-time code or Google" sub="Each sign-in is verified with a code sent to you, or by Google" right={<Pill tone="good">Active</Pill>} />
        <Link href="/login" className={cn(btn.ghost, btn.sm, 'self-start')}>
          Sign in again on another device
        </Link>
      </Card>
    </>
  )
}
