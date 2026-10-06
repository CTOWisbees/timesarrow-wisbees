import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { linkProps } from '@/lib/links'
import type { SebiDisclosure, SiteSetting } from '@/payload-types'

type Officer = SebiDisclosure['principalOfficer']

const officerLine = (officer: Officer) =>
  [officer?.name, officer?.phone, officer?.email].filter(Boolean).join(', ')

/**
 * Mandatory SEBI disclosure surface. Every value comes from the SEBI disclosure
 * global so compliance can maintain it without a deploy.
 */
export function SiteFooter({
  logo,
  settings,
  sebi,
}: {
  logo: React.ReactNode
  settings: SiteSetting
  sebi: SebiDisclosure
}) {
  const registration = [
    sebi.registrationType && `Registered as: ${sebi.registrationType}`,
    sebi.sebiRegistrationNumber && `SEBI registration no. ${sebi.sebiRegistrationNumber}`,
    sebi.validity,
  ].filter(Boolean)
  const offices = [
    sebi.baslId && `BSE / BASL ID: ${sebi.baslId}`,
    sebi.sebiRegionalOffice && `Corresponding SEBI regional office: ${sebi.sebiRegionalOffice}`,
  ].filter(Boolean)
  const officers = [
    officerLine(sebi.principalOfficer) && `Principal Officer: ${officerLine(sebi.principalOfficer)}`,
    officerLine(sebi.complianceOfficer) && `Compliance Officer: ${officerLine(sebi.complianceOfficer)}`,
  ].filter(Boolean)

  return (
    <footer className="bg-night text-white/80">
      <div className="container-page py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div className="space-y-4 text-sm">
            <div className="inline-flex rounded-lg bg-white px-3 py-2">{logo}</div>
            <p>{sebi.firmName}</p>
            <address className="not-italic">
              {sebi.registeredAddress && <span className="block whitespace-pre-line">{sebi.registeredAddress}</span>}
              {sebi.phone && <span className="block">{sebi.phone}</span>}
            </address>
          </div>

          {settings.footerColumns?.map((column) => (
            <nav key={column.id ?? column.heading} aria-label={column.heading}>
              <h2 className="mb-4 font-sans text-sm font-semibold text-white">{column.heading}</h2>
              <ul className="space-y-3 text-sm">
                {column.links?.map((link) => (
                  <li key={link.id ?? link.href}>
                    <Link href={link.href} {...linkProps(link.href)} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-night-line mt-12 flex flex-col gap-5 rounded-xl border p-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 text-sm">
            <h2 className="font-sans text-base font-semibold text-white">SEBI registration details</h2>
            {[registration, offices, officers].map(
              (parts, i) => parts.length > 0 && <p key={i}>{parts.join(' · ')}</p>,
            )}
          </div>
          <Button asChild variant="amber" size="cta" className="h-11 shrink-0 self-start px-5 text-sm">
            <Link href="/sebi-disclosure">SEBI disclosure</Link>
          </Button>
        </div>

        {sebi.disclaimers && sebi.disclaimers.length > 0 && (
          <div className="mt-10 space-y-3 text-[0.8125rem] leading-relaxed" data-disclaimer>
            {sebi.disclaimers.map((d) => (
              <p key={d.id ?? d.text}>{d.text}</p>
            ))}
          </div>
        )}

        <div className="border-night-line mt-10 flex flex-col gap-3 border-t pt-6 text-[0.8125rem] md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {sebi.firmName}. All rights reserved.
          </p>
          {sebi.legalLinks && sebi.legalLinks.length > 0 && (
            <ul className="flex flex-wrap gap-x-2 gap-y-1">
              {sebi.legalLinks.map((link, i) => (
                <li key={link.id ?? link.href} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden>·</span>}
                  <Link href={link.href} {...linkProps(link.href)} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  )
}
