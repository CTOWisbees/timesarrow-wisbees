'use client'

import { Check, Download, FileText, Lock, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { connections, documents, family, invoices, tiers } from '@/lib/portal/data'
import { feeCheck, FEE_CAP_PER_YEAR } from '@/lib/portal/math'
import { cn } from '@/lib/utils'

import { btn, Card, CardHead, Disclaimer, lakh, PageHead, Pill, Row, rupees } from '../ui'
import { usePortal } from '../state'

export function Account({ screen }: { screen: 'documents' | 'family' | 'plan' | 'privacy' }) {
  return screen === 'documents' ? <Documents /> : screen === 'family' ? <Family /> : screen === 'plan' ? <Plan /> : <Privacy />
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn('relative h-[1.625rem] w-11 shrink-0 rounded-full transition-colors', on ? 'bg-primary' : 'bg-border')}
    >
      <span className={cn('absolute top-[3px] left-[3px] size-5 rounded-full bg-white transition-transform', on && 'translate-x-[1.1rem]')} />
    </button>
  )
}

function Documents() {
  const { say } = usePortal()
  return (
    <>
      <PageHead
        title="My Documents"
        sub="Everything in one safe place."
        right={
          <button type="button" className={btn.ghost} onClick={() => say('Upload opens once your accounts are linked.')}>
            <Plus className="size-4" aria-hidden /> Upload
          </button>
        }
      />
      <Card flat>
        {documents.map((d) => (
          <Row
            key={d.name}
            icon={<FileText className="size-5" aria-hidden />}
            title={d.name}
            sub={`${d.date} · ${d.type}`}
            right={
              <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say(`${d.name}: download starts when your documents are live.`)}>
                <Download className="size-3.5" aria-hidden /> Download
              </button>
            }
          />
        ))}
      </Card>
      <p className="text-muted-foreground text-sm">Documents are stored in India, encrypted, and kept for the time the law requires.</p>
    </>
  )
}

function Family() {
  const { say } = usePortal()
  const [shared, setShared] = useState(() => Object.fromEntries(family.map((p) => [p.name, p.shared])))
  const sum = family.filter((p) => shared[p.name]).reduce((s, p) => s + p.total, 0)
  return (
    <>
      <PageHead
        title="My Family"
        sub="See everyone's money together. Each person controls what they share."
        right={
          <button type="button" className={btn.primary} onClick={() => say('Invitations go out once family view is switched on for your plan.')}>
            <Plus className="size-4" aria-hidden /> Invite
          </button>
        }
      />
      <div className="grid gap-5 md:grid-cols-3">
        {family.map((p) => (
          <Card key={p.name}>
            <div className="flex items-center gap-3">
              <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full font-bold">{p.name.charAt(0)}</span>
              <div>
                <b>{p.name}</b>
                <div className="text-muted-foreground text-sm">{p.role}</div>
              </div>
            </div>
            <div className="font-heading text-2xl font-semibold tabular-nums">{lakh(p.total)}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Share with family</span>
              <Switch on={shared[p.name]} onChange={(v) => setShared((s) => ({ ...s, [p.name]: v }))} label={`Share ${p.name}`} />
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <CardHead title="Family total" />
        <div className="font-heading text-4xl font-semibold tabular-nums">{lakh(sum)}</div>
        <p className="text-muted-foreground text-sm">Adds only the people who switched sharing on. Each family member signs in with their own login.</p>
      </Card>
    </>
  )
}

function Plan() {
  const { say } = usePortal()
  const current = tiers.find((t) => t.id === 'plus')!
  const plus = feeCheck({ perMonth: 1_999 })
  return (
    <>
      <PageHead title="Plan and Billing" sub="Your plan, invoices and fee history." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Your plan" right={<Pill tone="good">Active</Pill>} />
          <div className="font-heading text-4xl font-semibold">{current.name}</div>
          <div className="text-muted-foreground">
            {current.price}
            {current.unit} · next payment 5 Nov
          </div>
          <ul className="flex flex-col gap-1.5">
            {current.includes.map((i) => (
              <li key={i} className="flex gap-2">
                <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                {i}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('Plan changes take effect from your next billing date.')}>
              Change plan
            </button>
            <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('To cancel, confirm with your adviser. You keep access until the period ends.')}>
              Cancel plan
            </button>
          </div>
        </Card>
        <Card>
          <CardHead title="Compare plans" />
          {tiers
            .filter((t) => t.id !== 'free')
            .map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {t.price}
                    {t.unit}
                  </div>
                </div>
                {t.id === 'plus' ? (
                  <Pill tone="good">Current</Pill>
                ) : (
                  <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say(`Switching to ${t.name} starts from your next billing date.`)}>
                    Switch
                  </button>
                )}
              </div>
            ))}
          <p className="text-muted-foreground text-sm">
            The fee is flat and is never more than SEBI’s limit of ₹{(FEE_CAP_PER_YEAR / 100_000).toFixed(2)} lakh a year per family. Your yearly fee is {rupees(plus.yearly)}
            {plus.withinCap ? ', within the limit.' : '.'} See all plans on the <Link href="/fees" className="text-primary underline underline-offset-2">fees page</Link>.
          </p>
        </Card>
      </div>
      <Card flat>
        <div className="px-5 pt-5 pb-2">
          <h3 className="text-lg font-semibold">Invoices</h3>
        </div>
        {invoices.map((i) => (
          <Row
            key={i.month}
            title={i.month}
            sub="Paid by UPI"
            right={
              <>
                <b className="tabular-nums">{rupees(i.amount)}</b>
                <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say(`Invoice for ${i.month}: download starts when billing is live.`)}>
                  Download
                </button>
              </>
            }
          />
        ))}
      </Card>
      <Disclaimer />
    </>
  )
}

function Privacy() {
  const { say } = usePortal()
  const [on, setOn] = useState(() => Object.fromEntries(connections.map((c) => [c.name, c.on])))
  return (
    <>
      <PageHead title="Privacy and Permissions" sub="You decide what we can see. Switch off any time." />
      <Card flat>
        {connections.map((c) => (
          <Row
            key={c.name}
            icon={<Lock className="size-5" aria-hidden />}
            title={c.name}
            sub={`${c.via} · ${c.until}`}
            right={<Switch on={on[c.name]} onChange={(v) => { setOn((s) => ({ ...s, [c.name]: v })); say(`${c.name}: sharing ${v ? 'on' : 'off'}.`) }} label={c.name} />}
          />
        ))}
      </Card>
      <Card>
        <CardHead title="Your data" />
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
          <li>Stored in India and encrypted.</li>
          <li>Never used to answer another person’s questions.</li>
          <li>Copilot is AI. Every AI answer is saved so our compliance team can review it, and you can read how AI is used in our <Link href="/ai-disclosure" className="text-primary underline underline-offset-2">AI disclosure</Link>.</li>
        </ul>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('Your data export will be emailed to you.')}>
            Download my data
          </button>
          <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('To delete your account, confirm with support. Records the law requires are kept.')}>
            Delete my account
          </button>
        </div>
      </Card>
      <Card>
        <CardHead title="Sign-in and devices" />
        <Row className="px-0" title="This device" sub="Signed in now" right={<Pill tone="good">Active</Pill>} />
        <Row className="px-0" title="Other devices" sub="Sign-in is by one-time code on each device" right={<Pill>None</Pill>} />
      </Card>
    </>
  )
}
