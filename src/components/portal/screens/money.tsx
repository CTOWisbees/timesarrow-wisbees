'use client'

import { Link2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { hasDrifted, stressTest } from '@/lib/portal/math'
import type { PortalData } from '@/lib/portal/types'
import { cn } from '@/lib/utils'

import { MixDonut, MixLegend } from '../charts'
import { usePortal } from '../state'
import { asOfText, Bar, btn, Card, CardHead, Disclaimer, EmptyState, IconBox, lakh, PageHead, Pill, rupees, Stat } from '../ui'

const TABS = [
  ['all', 'All holdings'],
  ['mix', 'Mix and checks'],
  ['cost', 'Costs and concentration'],
  ['stress', 'What if?'],
  ['add', 'Update accounts'],
] as const

type Tab = (typeof TABS)[number][0]

const RISK_WORD = { low: 'Low', moderate: 'Medium', high: 'High', very_high: 'Very high' } as const

export function Money() {
  const { data } = usePortal()
  const [tab, setTab] = useState<Tab>('all')

  if (!data.hasPortfolio)
    return (
      <>
        <PageHead title="My Money" sub="Everything you own, in one place." />
        <EmptyState title="Nothing here yet" body="Add your holdings in Port Scan, from a statement or by hand, and they show up here with your mix, costs and risk." href="/portfolio-scan" cta="Run a Port Scan" />
      </>
    )

  const shares = data.mix.find((m) => m.label === 'Shares')
  const withinLimit = data.risk.equityLimit === null || !shares ? null : shares.now <= data.risk.equityLimit + 3

  return (
    <>
      <PageHead title="My Money" sub={`Everything you added, as of ${asOfText(data.asOf)}.`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total money" value={lakh(data.total)} />
        <Stat
          label="Yearly return"
          value={data.yearlyReturn === null ? 'Not enough data' : `${(data.yearlyReturn * 100).toFixed(1)}%`}
          tone={data.yearlyReturn === null ? undefined : data.yearlyReturn >= 0 ? 'up' : 'down'}
          sub={data.benchmarkReturn !== null ? `${data.benchmarkName}: ${(data.benchmarkReturn * 100).toFixed(1)}%` : undefined}
        />
        <Stat label="Fees you pay each year" value={data.fees.yearly === null ? '–' : rupees(data.fees.yearly)} />
        <Stat
          label="Risk level"
          value={data.volatility ? RISK_WORD[data.volatility] : '–'}
          sub={withinLimit === null ? undefined : <Pill tone={withinLimit ? 'good' : 'warn'}>{withinLimit ? 'Within your comfort' : 'Above your comfort'}</Pill>}
        />
      </div>

      <div className="bg-mint inline-flex max-w-full flex-wrap gap-0.5 self-start rounded-xl p-1" role="group" aria-label="View">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={cn('rounded-lg px-3.5 py-2 text-sm font-semibold', tab === k ? 'bg-card text-ink shadow-sm' : 'text-muted-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'all' && <All data={data} />}
      {tab === 'mix' && <MixTab data={data} />}
      {tab === 'cost' && <Costs data={data} />}
      {tab === 'stress' && <Stress data={data} />}
      {tab === 'add' && <Accounts />}
      <Disclaimer />
    </>
  )
}

function All({ data }: { data: PortalData }) {
  return (
    <Card flat>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="text-muted-foreground text-left text-xs font-semibold">
              <th className="px-5 py-3">What you own</th>
              <th className="px-5 py-3 text-right">Worth now</th>
              <th className="px-5 py-3 text-right">Share</th>
              <th className="px-5 py-3 text-right">Gain or loss</th>
            </tr>
          </thead>
          <tbody>
            {data.holdings.map((h) => (
              <tr key={h.name} className="border-t">
                <td className="px-5 py-3">
                  <div className="font-semibold">{h.name}</div>
                  <div className="text-muted-foreground">{h.kind}</div>
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{rupees(h.value)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{h.weight.toFixed(1)}%</td>
                <td className={cn('px-5 py-3 text-right tabular-nums', h.gainPct === null ? 'text-muted-foreground' : h.gainPct >= 0 ? 'text-primary' : 'text-destructive')}>
                  {h.gainPct === null ? 'Cost not added' : `${h.gainPct >= 0 ? '+' : ''}${h.gainPct.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function MixTab({ data }: { data: PortalData }) {
  const top = data.biggest[0]
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHead title="Your money by type" />
        <div className="flex flex-wrap items-center gap-6">
          <MixDonut mix={data.mix} total={data.total} />
          <MixLegend mix={data.mix} withPlan />
        </div>
        {data.risk.equityLimit !== null && (
          <>
            <h4 className="font-sans text-base font-semibold">Shares against your limit</h4>
            {data.mix
              .filter((m) => m.plan !== null)
              .map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm">
                    <span>{m.label}</span>
                    <span className="tabular-nums">
                      now {m.now}% · limit {m.plan}%
                    </span>
                  </div>
                  <div className="relative">
                    <Bar pct={m.now} warn={hasDrifted({ label: m.label, now: m.now, plan: m.plan ?? m.now })} />
                    <u className="bg-ink absolute -top-0.5 -bottom-0.5 w-[3px] rounded-sm no-underline" style={{ left: `${m.plan}%` }} />
                  </div>
                </div>
              ))}
            <p className="text-muted-foreground text-sm">
              The black mark is the most shares your risk profile{data.risk.category ? ` (${data.risk.category})` : ''} allows. Amber means you are past it.
            </p>
          </>
        )}
      </Card>
      <Card>
        <CardHead title="Things worth a look" />
        <div className="flex flex-col gap-3.5">
          {top && top.share >= 10 && (
            <div>
              <Pill tone={top.share >= 20 ? 'warn' : 'info'}>Biggest holding</Pill>
              <p className="mt-1.5 text-sm">
                {top.name} is {top.share.toFixed(0)}% of everything you own. {top.share >= 20 ? 'That is a lot in one place.' : 'Worth keeping an eye on.'}
              </p>
            </div>
          )}
          {data.fees.regularShare !== null && data.fees.regularShare > 0 && (
            <div>
              <Pill tone="warn">Regular plans</Pill>
              <p className="mt-1.5 text-sm">About {(data.fees.regularShare * 100).toFixed(0)}% of your fund money is in regular plans. The direct plan of the same fund costs less each year.</p>
            </div>
          )}
          {data.losses.length > 0 && (
            <div>
              <Pill tone="info">Below what you paid</Pill>
              <p className="mt-1.5 text-sm">
                {data.losses.length} {data.losses.length === 1 ? 'holding is' : 'holdings are'} worth less than you paid. See Save Tax.
              </p>
            </div>
          )}
          {data.flagCount > 0 && (
            <div>
              <Pill tone="grey">Port Scan</Pill>
              <p className="mt-1.5 text-sm">
                {data.flagCount} {data.flagCount === 1 ? 'thing stands' : 'things stand'} out. <Link href="/portfolio" className="text-primary font-semibold">See them</Link>
              </p>
            </div>
          )}
          {!(top && top.share >= 10) && !data.flagCount && !data.losses.length && <p className="text-muted-foreground text-sm">Nothing stands out right now.</p>}
        </div>
      </Card>
    </div>
  )
}

function Costs({ data }: { data: PortalData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHead title="What your funds cost" />
        {data.fees.yearly === null ? (
          <p className="text-muted-foreground">Fund fees could not be read from what you added. Search for each fund by name in Port Scan so we can use its published yearly cost.</p>
        ) : (
          <>
            <div className="font-heading text-4xl font-semibold tabular-nums">{rupees(data.fees.yearly)}</div>
            <p className="text-muted-foreground text-sm">a year{data.fees.weightedTer !== null ? `, an average of ${data.fees.weightedTer.toFixed(2)}% of your fund money` : ''}.</p>
            <p className="text-sm">
              {data.fees.regularShare ? (
                <>
                  <Pill tone="warn">Regular plans</Pill> {(data.fees.regularShare * 100).toFixed(0)}% of your fund money pays a distributor commission. Direct plans usually cost about 0.5 to 1% less each year.
                </>
              ) : (
                <>
                  <Pill tone="good">Direct plans</Pill> No commission found in what you added.
                </>
              )}
            </p>
          </>
        )}
      </Card>
      <Card>
        <CardHead title="Your biggest holdings" />
        {data.biggest.map((b) => (
          <div key={b.name} className="flex items-center gap-3 py-1">
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{b.name}</div>
              <div className="text-muted-foreground text-sm">{b.kind}</div>
            </div>
            <Pill tone={b.share >= 20 ? 'warn' : b.share >= 10 ? 'info' : 'good'}>{b.share.toFixed(0)}% of your money</Pill>
          </div>
        ))}
        <p className="text-muted-foreground text-sm">We flag a single holding past 20%. Funds that already hold many companies are counted as one holding here.</p>
      </Card>
    </div>
  )
}

function Stress({ data }: { data: PortalData }) {
  const [fall, setFall] = useState(20)
  const shares = ((data.mix.find((m) => m.label === 'Shares')?.now ?? 0) / 100) * data.total
  const bonds = ((data.mix.find((m) => m.label === 'Bonds')?.now ?? 0) / 100) * data.total
  const r = stressTest({ shares, bonds, total: data.total }, fall)
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
        <Stat label="Change in your money" value={`−${r.lossPct.toFixed(1)}%`} />
      </div>
      <p className="text-muted-foreground text-sm">Bonds are assumed to fall a fifth as much as shares; gold and cash are left unchanged. Nothing here is a prediction.</p>
    </Card>
  )
}

function Accounts() {
  const rows: [string, string, string, string?][] = [
    ['Statement upload', 'A CAS PDF or a broker file. We read it in your browser, you confirm it.', 'Available', '/portfolio-scan'],
    ['Type holdings in', 'Search a fund or stock, or paste from Excel.', 'Available', '/portfolio-scan'],
    ['Bank accounts (Account Aggregator)', 'Link securely through RBI’s Account Aggregator.', 'Coming soon'],
    ['CAMS and KFintech', 'Pull your mutual funds in one step.', 'Coming soon'],
    ['Broker link', 'Connect your demat account.', 'Coming soon'],
  ]
  return (
    <Card>
      <CardHead title="Keep your holdings up to date" />
      <p className="text-muted-foreground">Today your numbers come from what you add in Port Scan. Re-run it whenever your holdings change. Automatic linking is on the way.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(([t, s, st, href]) => {
          const body = (
            <>
              <IconBox>
                <Link2 className="size-5" aria-hidden />
              </IconBox>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{t}</div>
                <div className="text-muted-foreground text-sm">{s}</div>
              </div>
              <Pill tone={st === 'Available' ? 'good' : 'grey'}>{st}</Pill>
            </>
          )
          return href ? (
            <Link key={t} href={href} className="hover:border-primary flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-colors">
              {body}
            </Link>
          ) : (
            <div key={t} className="flex items-center gap-3.5 rounded-xl border px-4 py-3.5 opacity-80">
              {body}
            </div>
          )
        })}
      </div>
      <Link href="/portfolio-scan" className={cn(btn.primary, 'self-start')}>
        Update my holdings
      </Link>
    </Card>
  )
}
