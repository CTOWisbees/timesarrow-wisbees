'use client'

import { Link2 } from 'lucide-react'
import { useState } from 'react'

import { fundCosts, holdings, mix, overlap, totalValue, assetValue } from '@/lib/portal/data'
import { hasDrifted, stressTest } from '@/lib/portal/math'
import { cn } from '@/lib/utils'

import { MixDonut, MixLegend } from '../charts'
import { Bar, Card, CardHead, Disclaimer, IconBox, lakh, PageHead, Pill, rupees, Stat } from '../ui'

const TABS = [
  ['all', 'All holdings'],
  ['mix', 'Mix and checks'],
  ['cost', 'Costs and overlap'],
  ['stress', 'What if?'],
  ['add', 'Add accounts'],
] as const

type Tab = (typeof TABS)[number][0]

export function Money() {
  const [tab, setTab] = useState<Tab>('all')
  const fees = fundCosts.reduce((s, f) => s + f.rupees, 0)

  return (
    <>
      <PageHead title="My Money" sub="Everything you own, in one place." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total money" value={lakh(totalValue)} />
        <Stat label="Yearly return" value="11.2%" tone="up" sub="Nifty 50: 10.4%" />
        <Stat label="Fees you pay each year" value={rupees(fees)} />
        <Stat label="Risk level" value="Medium" sub={<Pill tone="good">Within your comfort</Pill>} />
      </div>

      <div className="bg-mint inline-flex max-w-full flex-wrap gap-0.5 self-start rounded-xl p-1" role="group" aria-label="View">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={cn('rounded-lg px-3.5 py-2 text-sm font-semibold', tab === k ? 'bg-card text-ink shadow-sm' : 'text-muted-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'all' && <All />}
      {tab === 'mix' && <MixTab />}
      {tab === 'cost' && <Costs fees={fees} />}
      {tab === 'stress' && <Stress />}
      {tab === 'add' && <Accounts />}
      <Disclaimer />
    </>
  )
}

function All() {
  return (
    <Card flat>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="text-muted-foreground text-left text-xs font-semibold">
              <th className="px-5 py-3">What you own</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">Worth now</th>
              <th className="px-5 py-3 text-right">Gain or loss</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.name} className="border-t">
                <td className="px-5 py-3">
                  <div className="font-semibold">{h.name}</div>
                  <div className="text-muted-foreground">{h.kind}</div>
                </td>
                <td className="px-5 py-3">{h.asset}</td>
                <td className="px-5 py-3 text-right tabular-nums">{rupees(h.value)}</td>
                <td className={cn('px-5 py-3 text-right tabular-nums', h.gainPct >= 0 ? 'text-[#1b7f4b]' : 'text-destructive')}>
                  {h.gainPct >= 0 ? '+' : ''}
                  {h.gainPct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function MixTab() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHead title="Your money by type" />
        <div className="flex flex-wrap items-center gap-6">
          <MixDonut />
          <MixLegend />
        </div>
        <h4 className="font-sans text-base font-semibold">Plan vs now</h4>
        {mix.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-sm">
              <span>{m.label}</span>
              <span className="tabular-nums">
                now {m.now}% · plan {m.plan}%
              </span>
            </div>
            <div className="relative">
              <Bar pct={m.now} warn={hasDrifted(m)} />
              <u className="bg-ink absolute -top-0.5 -bottom-0.5 w-[3px] rounded-sm no-underline" style={{ left: `${m.plan}%` }} />
            </div>
          </div>
        ))}
        <p className="text-muted-foreground text-sm">The black mark is your plan. Amber means it has drifted.</p>
      </Card>
      <Card>
        <CardHead title="Things worth a look" />
        <div className="flex flex-col gap-3.5">
          <div>
            <Pill tone="warn">Too much in one place</Pill>
            <p className="mt-1.5 text-sm">HDFC Bank appears in 3 of your holdings (directly and inside 2 funds). Together that is about 10% of your money.</p>
          </div>
          <div>
            <Pill tone="info">Doing the same job</Pill>
            <p className="mt-1.5 text-sm">Two of your funds hold many of the same large companies. You may not need both.</p>
          </div>
          <div>
            <Pill tone="good">Costs</Pill>
            <p className="mt-1.5 text-sm">Your funds cost about ₹9,100 a year in fees. All are low-cost direct plans.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Costs({ fees }: { fees: number }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card flat>
        <div className="px-5 pt-5 pb-2">
          <h3 className="text-lg font-semibold">What your funds cost</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-left text-xs font-semibold">
              <th className="px-5 py-2.5">Fund</th>
              <th className="px-5 py-2.5 text-right">Yearly fee</th>
              <th className="px-5 py-2.5 text-right">Rupees a year</th>
            </tr>
          </thead>
          <tbody>
            {fundCosts.map((f) => (
              <tr key={f.fund} className="border-t">
                <td className="px-5 py-2.5 font-semibold">{f.fund}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{f.ratio.toFixed(2)}%</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{rupees(f.rupees)}</td>
              </tr>
            ))}
            <tr className="border-t font-bold">
              <td className="px-5 py-2.5">Total</td>
              <td />
              <td className="px-5 py-2.5 text-right tabular-nums">{rupees(fees)}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-muted-foreground px-5 py-3 text-sm">
          All are direct plans. Regular plans of the same funds usually cost about 0.5 to 1% more each year. That is roughly ₹12,000 a year you avoid (estimate).
        </p>
      </Card>
      <Card>
        <CardHead title="Same company in many places" />
        {overlap.map((o) => (
          <div key={o.name} className="flex items-center gap-3 py-1">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{o.name}</div>
              <div className="text-muted-foreground text-sm">in {o.where}</div>
            </div>
            <Pill tone={o.flag ? 'warn' : 'good'}>{o.share}% of your money</Pill>
          </div>
        ))}
        <p className="text-muted-foreground text-sm">We flag a name when it passes 10% of your money. Owning it directly and through funds counts together.</p>
      </Card>
    </div>
  )
}

function Stress() {
  const [fall, setFall] = useState(20)
  const shares = assetValue('Shares')
  const bonds = assetValue('Bonds')
  const r = stressTest({ shares, bonds, total: totalValue }, fall)
  return (
    <Card>
      <CardHead title="What if markets fall?" />
      <p className="text-muted-foreground">Slide to see how a fall in shares could change your total money. This is a simple what-if, not a forecast.</p>
      <label htmlFor="fall" className="text-muted-foreground text-sm">
        Shares fall by
      </label>
      <div className="font-heading text-2xl font-semibold">{fall}%</div>
      <input id="fall" type="range" min={5} max={50} step={5} value={fall} onChange={(e) => setFall(Number(e.target.value))} className="accent-primary w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Your total money would be" value={lakh(r.left)} />
        <Stat label="Change" value={`−${lakh(r.loss)}`} tone="down" />
        <Stat label="Emergency fund" value="Not affected" tone="up" />
      </div>
      <p className="text-muted-foreground text-sm">
        Past big falls: Nifty 50 dropped about 60% in 2008 and about 38% in early 2020, then recovered over time. Bonds and cash usually fall less. Nothing here is a prediction.
      </p>
    </Card>
  )
}

function Accounts() {
  const rows = [
    ['Bank accounts', "Link securely through RBI's Account Aggregator", 'Linked'],
    ['Mutual funds', 'Pulled from CAMS and KFintech', 'Linked'],
    ['Stocks (demat)', 'Connect your broker', 'Linked'],
    ['Insurance', 'Link your policies to see cover', 'Not linked'],
    ['Property, gold at home, loans you gave', 'Type it in yourself', 'Add by hand'],
    ['Upload a statement', 'PDF from your bank or fund house. We read it, you confirm.', 'Upload'],
  ]
  return (
    <Card>
      <CardHead title="Add another account" />
      <p className="text-muted-foreground">Link your accounts so everything shows in one place. You choose what to share and can stop sharing any time.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(([t, s, st]) => (
          <div key={t} className="flex items-center gap-3.5 rounded-xl border px-4 py-3.5">
            <IconBox>
              <Link2 className="size-5" aria-hidden />
            </IconBox>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{t}</div>
              <div className="text-muted-foreground text-sm">{s}</div>
            </div>
            <Pill tone={st === 'Linked' ? 'good' : 'grey'}>{st}</Pill>
          </div>
        ))}
      </div>
    </Card>
  )
}
