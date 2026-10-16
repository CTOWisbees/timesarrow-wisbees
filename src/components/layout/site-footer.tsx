import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { linkProps } from '@/lib/links'
import type { SebiDisclosure, SiteSetting } from '@/payload-types'

type Officer = SebiDisclosure['principalOfficer']

const officerLine = (officer: Officer) => [officer?.name, officer?.phone, officer?.email].filter(Boolean).join(' · ')

/**
 * Site footer: brand and contact, link columns, then the mandatory SEBI block (entity
 * and registration details on the left, the risk disclaimers in a card on the right).
 * Every value comes from Site settings or the SEBI disclosure global, so compliance
 * maintains it without a deploy; empty values are not rendered.
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
    sebi.registrationType && `Registration type: ${sebi.registrationType}`,
    sebi.sebiRegistrationNumber && `SEBI registration no. ${sebi.sebiRegistrationNumber}`,
    sebi.baslId && `BSE / BASL ID: ${sebi.baslId}`,
    sebi.validity,
  ].filter(Boolean)
  const officers = [
    officerLine(sebi.principalOfficer) && `Principal Officer: ${officerLine(sebi.principalOfficer)}`,
    officerLine(sebi.complianceOfficer) && `Compliance Officer: ${officerLine(sebi.complianceOfficer)}`,
  ].filter(Boolean)
  const social = settings.socialLinks ?? []

  return (
    <footer className="bg-mist text-ink-soft border-t">
      <div className="container-page py-14 md:py-16">
        {/* Brand and contact | link columns */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="max-w-md">
            {logo}
            {settings.footerTagline && <p className="mt-5 text-[0.95rem] leading-relaxed">{settings.footerTagline}</p>}
            {(sebi.phone || sebi.registeredAddress) && (
              <div className="mt-7 space-y-1.5 text-sm">
                <p className="text-ink font-semibold">Get in touch</p>
                {sebi.phone && (
                  <a href={`tel:+91${sebi.phone.replace(/\D/g, '').slice(-10)}`} className="text-ink hover:text-primary block tabular-nums">
                    +91 {sebi.phone}
                  </a>
                )}
                {sebi.registeredAddress && <address className="leading-relaxed not-italic">{sebi.registeredAddress}</address>}
              </div>
            )}
          </div>

          <div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {settings.footerColumns?.map((column) => (
                <nav key={column.id ?? column.heading} aria-label={column.heading}>
                  <h2 className="text-ink font-sans text-sm font-semibold">{column.heading}</h2>
                  <ul className="mt-4 space-y-3 text-[0.95rem]">
                    {column.links?.map((link) => (
                      <li key={link.id ?? link.href}>
                        <Link href={link.href} {...linkProps(link.href)} className="hover:text-primary transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
            {social.length > 0 && (
              <ul className="mt-10 flex gap-3" aria-label="Social media">
                {social.map((s) => (
                  <li key={s.id ?? s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:text-primary hover:border-primary bg-card flex size-10 items-center justify-center rounded-full border transition-colors"
                    >
                      <SocialMark platform={s.platform} />
                      <span className="sr-only">{s.platform === 'x' ? 'X' : s.platform}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* SEBI: entity and registration | disclaimers */}
        <div className="mt-14 grid gap-8 border-t pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="text-ink font-semibold">{sebi.firmName}</p>
            {registration.length > 0 && (
              <ul className="space-y-1">
                {registration.map((line) => (
                  <li key={line as string}>{line}</li>
                ))}
              </ul>
            )}
            {officers.length > 0 && (
              <ul className="space-y-1">
                {officers.map((line) => (
                  <li key={line as string} className="break-words">
                    {line}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/sebi-disclosure" className="text-primary inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
              SEBI disclosures
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {sebi.disclaimers && sebi.disclaimers.length > 0 && (
            <div className="bg-card space-y-3 rounded-2xl border p-6 text-[0.8125rem] leading-relaxed sm:p-7" data-disclaimer>
              {sebi.disclaimers.map((d) => (
                <p key={d.id ?? d.text}>{d.text}</p>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-3 text-[0.8125rem] md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {sebi.firmName}. All rights reserved.
          </p>
          {sebi.legalLinks && sebi.legalLinks.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {sebi.legalLinks.map((link) => (
                <li key={link.id ?? link.href}>
                  <Link href={link.href} {...linkProps(link.href)} className="hover:text-primary transition-colors">
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

/** Simple brand marks (lucide no longer ships brand icons). */
function SocialMark({ platform }: { platform: string }) {
  const paths: Record<string, string> = {
    linkedin:
      'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.05c.53-1 1.83-1.8 3.77-1.8 4 0 4.73 2.4 4.73 5.6v5.7h-4v-5c0-1.2 0-2.75-1.7-2.75s-1.95 1.3-1.95 2.65v5.1h-4v-11Z',
    instagram:
      'M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm6.1-8.1a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.6c2.7 0 3 0 4.1.06 2.7.12 4 1.4 4.1 4.1.06 1.1.06 1.4.06 4.1s0 3-.06 4.1c-.12 2.7-1.4 4-4.1 4.1-1.1.06-1.4.06-4.1.06s-3 0-4.1-.06c-2.7-.12-4-1.4-4.1-4.1C3.6 15 3.6 14.7 3.6 12s0-3 .06-4.1C3.8 5.2 5 3.9 7.9 3.8 9 3.6 9.3 3.6 12 3.6Z',
    x: 'M17.6 3.5h3l-6.6 7.6 7.8 10.4h-6.1l-4.8-6.3-5.5 6.3h-3l7.1-8.1L2 3.5h6.2l4.3 5.8 5.1-5.8Zm-1.1 16.2h1.7L7.5 5.2H5.7l10.8 14.5Z',
    youtube:
      'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z',
  }
  return (
    <svg viewBox="0 0 24 24" className="size-[1.05rem] fill-current" aria-hidden>
      <path d={paths[platform] ?? ''} />
    </svg>
  )
}
