import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getSebiDisclosure } from '@/lib/queries'
import { cn } from '@/lib/utils'
import type { SebiDisclosure } from '@/payload-types'

export const revalidate = 3600
export const metadata: Metadata = { title: 'SEBI disclosures' }

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
const officer = (o: SebiDisclosure['principalOfficer']) => [o?.name, o?.phone, o?.email].filter(Boolean).join(' · ')

/**
 * SEBI-mandated disclosures for an Investment Adviser: registration details, complaint
 * data and escalation, the investor charter and the risk disclaimers. Every value comes
 * from the SEBI disclosure global; blocks without data are not rendered.
 */
export default async function SebiDisclosurePage() {
  const sebi = await getSebiDisclosure()

  const registration: [string, string | null | undefined][] = [
    ['Name of the entity', sebi.firmName],
    ['Type of registration', sebi.registrationType],
    ['SEBI registration number', sebi.sebiRegistrationNumber],
    ['Validity of registration', sebi.validity],
    ['BSE / BASL enlistment ID', sebi.baslId],
    ['Registered address', sebi.registeredAddress],
    ['Phone', sebi.phone],
    ['Corresponding SEBI office', sebi.sebiRegionalOffice],
    ['Principal Officer', officer(sebi.principalOfficer)],
    ['Compliance Officer', officer(sebi.complianceOfficer)],
  ]
  const steps = sebi.complaintSteps ?? []
  const complaintRows = sebi.complaintRows ?? []
  const monthly = sebi.monthlyDisposal ?? []
  const annual = sebi.annualDisposal ?? []
  const matrix = sebi.escalationMatrix ?? []
  const audits = sebi.complianceAudits ?? []
  const charter = sebi.charter ?? []
  const disclaimers = sebi.disclaimers ?? []

  const sections = [
    { id: 'registration', label: 'Registration details', show: true },
    { id: 'complaints', label: 'Investor complaints', show: true },
    { id: 'escalation', label: 'Grievance escalation', show: matrix.length > 0 },
    { id: 'audit', label: 'Compliance audit', show: audits.length > 0 },
    { id: 'charter', label: 'Investor charter', show: charter.length > 0 },
    { id: 'disclaimers', label: 'Disclaimers', show: disclaimers.length > 0 },
  ].filter((s) => s.show)

  return (
    <div className="bg-paper">
      <div className="container-page py-12 md:py-16">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">SEBI disclosures</h1>
          <p className="text-ink-soft mt-4 text-lg leading-relaxed">
            Registration details, complaint data, how to raise a grievance, and the SEBI investor charter for{' '}
            {sebi.firmName}.
          </p>
          {sebi.updatedAt && (
            <p className="text-muted-foreground mt-3 text-sm">Last updated {dateFormat.format(new Date(sebi.updatedAt))}</p>
          )}
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="sticky top-[calc(var(--header-h)+2rem)] space-y-1 border-l text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-soft hover:text-primary hover:border-primary -ml-px block border-l border-transparent py-1.5 pl-4 transition-colors">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 max-w-3xl space-y-14">
            <Block id="registration" title="Registration details">
              <dl className="bg-card divide-y rounded-2xl border">
                {registration
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
                      <dt className="text-muted-foreground text-sm">{label}</dt>
                      <dd className="text-ink text-[0.95rem] leading-relaxed whitespace-pre-line">{value}</dd>
                    </div>
                  ))}
              </dl>
            </Block>

            <Block id="complaints" title="Investor complaints">
              {steps.length > 0 && (
                <ol className="space-y-4">
                  {steps.map((step, idx) => (
                    <Step key={step.id ?? idx} n={idx + 1} title={step.title}>
                      {step.text}
                      {step.linkHref && (
                        <>
                          {' '}
                          <ExternalLink href={step.linkHref}>{step.linkLabel || step.linkHref}</ExternalLink>
                        </>
                      )}
                      {idx === 0 && officer(sebi.complianceOfficer) && (
                        <span className="text-ink mt-2 block text-sm font-medium">
                          Compliance Officer: {officer(sebi.complianceOfficer)}
                        </span>
                      )}
                    </Step>
                  ))}
                </ol>
              )}
              {sebi.physicalComplaints && <p className="text-ink-soft mt-5 text-sm leading-relaxed">{sebi.physicalComplaints}</p>}

              {complaintRows.length > 0 && (
                <DataTable
                  caption={`Complaints received${sebi.complaintsAsOf ? `, ${sebi.complaintsAsOf}` : ''}`}
                  head={['Received from', 'Pending at end of last month', 'Received', 'Resolved', 'Total pending', 'Pending > 3 months', 'Avg. resolution time (days)']}
                  rows={complaintRows.map((r) => [r.source, r.pendingLastMonth, r.received, r.resolved, r.totalPending, r.pendingOver3Months, r.avgResolutionDays])}
                />
              )}
              {monthly.length > 0 && (
                <DataTable
                  caption="Trend of monthly disposal of complaints"
                  head={['Month', 'Carried forward', 'Received', 'Resolved', 'Pending']}
                  rows={monthly.map((r) => [r.period, r.carriedForward, r.received, r.resolved, r.pending])}
                />
              )}
              {annual.length > 0 && (
                <DataTable
                  caption="Trend of annual disposal of complaints"
                  head={['Year', 'Carried forward', 'Received', 'Resolved', 'Pending']}
                  rows={annual.map((r) => [r.period, r.carriedForward, r.received, r.resolved, r.pending])}
                />
              )}
            </Block>

            {matrix.length > 0 && (
              <Block id="escalation" title="Grievance escalation matrix">
                <DataTable
                  head={['Designation', 'Contact person', 'Phone', 'Email', ...(matrix.some((m) => m.workingHours) ? ['Working hours'] : [])]}
                  rows={matrix.map((m) => [m.designation, m.contactPerson, m.phone, m.email, ...(matrix.some((x) => x.workingHours) ? [m.workingHours] : [])])}
                />
              </Block>
            )}

            {audits.length > 0 && (
              <Block id="audit" title="Annual compliance audit">
                <DataTable head={['Financial year', 'Status', 'Remarks']} rows={audits.map((a) => [a.financialYear, a.status, a.remarks])} />
              </Block>
            )}

            {charter.length > 0 && (
              <Block id="charter" title="Investor charter for Investment Advisers">
                <p className="text-ink-soft -mt-2 mb-5 text-sm">As published by SEBI.</p>
                <Accordion type="multiple" defaultValue={[charter[0].id ?? '0']} className="bg-card rounded-2xl border px-5">
                  {charter.map((section, idx) => (
                    <AccordionItem key={section.id ?? idx} value={section.id ?? String(idx)}>
                      <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
                        <span>
                          <span className="text-primary mr-2 font-sans">{String.fromCharCode(65 + idx)}.</span>
                          {section.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-ink-soft pb-6 text-[0.95rem] leading-relaxed">
                        {section.intro && <p className="mb-3">{section.intro}</p>}
                        <CharterItems items={section.items ?? []} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Block>
            )}

            {disclaimers.length > 0 && (
              <Block id="disclaimers" title="Disclaimers">
                <ul className="text-ink-soft space-y-3 text-[0.95rem] leading-relaxed">
                  {disclaimers.map((d) => (
                    <li key={d.id ?? d.text}>{d.text}</li>
                  ))}
                </ul>
              </Block>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-[calc(var(--header-h)+1.5rem)]">
      <h2 id={`${id}-title`} className="mb-5 text-2xl font-semibold tracking-tight md:text-[1.75rem]">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="bg-card flex gap-4 rounded-2xl border p-5">
      <span aria-hidden className="bg-mint text-brand-green-strong flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
        {n}
      </span>
      <div>
        <p className="text-ink font-semibold">{title}</p>
        <div className="text-ink-soft mt-1 text-[0.95rem] leading-relaxed">{children}</div>
      </div>
    </li>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-0.5 underline-offset-4 hover:underline">
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/** A data table that scrolls sideways inside its own frame on small screens. */
function DataTable({ caption, head, rows }: { caption?: string; head: string[]; rows: (string | number | null | undefined)[][] }) {
  return (
    <div className="bg-card mt-6 overflow-hidden rounded-2xl border">
      {caption && <p className="text-ink border-b px-5 py-3 text-sm font-semibold">{caption}</p>}
      <Table className="text-sm">
        <TableHeader>
          <TableRow className="bg-mist hover:bg-mist">
            {head.map((h) => (
              <TableHead key={h} className="text-ink-soft h-auto px-4 py-3 align-bottom font-medium whitespace-normal">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, r) => (
            <TableRow key={r}>
              {row.map((cell, c) => (
                <TableCell key={c} className={cn('px-4 py-3 whitespace-normal', typeof cell === 'number' && 'tabular-nums')}>
                  {cell ?? '—'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

type CharterItem = NonNullable<NonNullable<SebiDisclosure['charter']>[number]['items']>[number]

function CharterItems({ items }: { items: CharterItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) =>
        item.kind === 'heading' ? (
          <p key={item.id ?? idx} className="text-ink pt-2 font-semibold first:pt-0">
            {item.text}
          </p>
        ) : (
          <p key={item.id ?? idx} className={cn('relative pl-5', item.kind === 'subitem' && 'ml-5')}>
            <span aria-hidden className={cn('absolute top-[0.6em] left-0 rounded-full', item.kind === 'subitem' ? 'border-ink-soft size-1.5 border' : 'bg-primary size-1.5')} />
            {item.text}
          </p>
        ),
      )}
    </div>
  )
}
