import type { Metadata } from 'next'
import Link from 'next/link'

import { Logo } from '@/components/layout/logo'
import { getSebiDisclosure, getSiteSettings } from '@/lib/queries'

import { sans, serif } from '../fonts'

import '../(frontend)/globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    metadataBase: new URL(siteUrl),
    title: { default: settings.siteName, template: `%s · ${settings.siteName}` },
    // Account pages are never indexed, whatever SITE_INDEXABLE says.
    robots: { index: false, follow: false },
  }
}

/** Root layout for the signed-in app area: login, onboarding, and later the dashboard. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [settings, sebi] = await Promise.all([getSiteSettings(), getSebiDisclosure()])

  return (
    <html lang="en-IN" data-scroll-behavior="smooth" className={`${sans.variable} ${serif.variable}`}>
      <body className="bg-paper flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden" suppressHydrationWarning>
        <a
          href="#main"
          className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <header className="bg-card shrink-0 border-b">
          <div className="container-page flex h-[calc(var(--header-h)-1px)] items-center justify-between gap-4">
            <Logo logo={settings.logo} siteName={settings.siteName} />
            <Link href="/" className="text-ink-soft hover:text-primary text-sm font-medium">
              Back to {settings.siteName}
            </Link>
          </div>
        </header>
        <main id="main" className="flex flex-1 flex-col lg:min-h-0">
          {children}
        </main>
        <footer className="bg-card shrink-0 border-t">
          <div className="container-page text-muted-foreground flex flex-col gap-1 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>
              {sebi.firmName} · SEBI registration {sebi.sebiRegistrationNumber}
            </p>
            <Link href="/sebi-disclosure" className="hover:text-primary underline-offset-4 hover:underline">
              SEBI disclosure
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
