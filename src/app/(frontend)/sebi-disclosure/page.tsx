import type { Metadata } from 'next'

import { RichText } from '@/components/shared/rich-text'
import { getSebiDisclosure } from '@/lib/queries'

export const revalidate = 3600
export const metadata: Metadata = { title: 'SEBI disclosure' }

export default async function SebiDisclosurePage() {
  const sebi = await getSebiDisclosure()
  const rows: [string, string | null | undefined][] = [
    ['Name of the entity', sebi.firmName],
    ['Type of registration', sebi.registrationType],
    ['SEBI registration number', sebi.sebiRegistrationNumber],
    ['Validity', sebi.validity],
    ['BSE / BASL ID', sebi.baslId],
    ['Registered address', sebi.registeredAddress],
    ['Phone', sebi.phone],
    ['Principal Officer', [sebi.principalOfficer?.name, sebi.principalOfficer?.phone, sebi.principalOfficer?.email].filter(Boolean).join(', ')],
    ['Compliance Officer', [sebi.complianceOfficer?.name, sebi.complianceOfficer?.phone, sebi.complianceOfficer?.email].filter(Boolean).join(', ')],
    ['Corresponding SEBI regional office', sebi.sebiRegionalOffice],
  ]

  return (
    <div className="container-page max-w-4xl py-16 md:py-20">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">SEBI disclosure</h1>
      <dl className="bg-card mt-10 divide-y rounded-xl border">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[16rem_1fr] sm:gap-6">
              <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
              <dd className="text-sm whitespace-pre-line">{value}</dd>
            </div>
          ))}
      </dl>
      <RichText data={sebi.pageBody} className="text-ink-soft mt-12 leading-relaxed" />
    </div>
  )
}
