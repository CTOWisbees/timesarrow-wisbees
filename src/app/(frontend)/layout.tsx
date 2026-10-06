import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { Public_Sans, Source_Serif_4 } from 'next/font/google'

import { Logo } from '@/components/layout/logo'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { getSebiDisclosure, getSiteSettings } from '@/lib/queries'

import './globals.css'

const sans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans', display: 'swap' })
const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  axes: ['opsz'],
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
// Stays false until BASL approves the content, so nothing is indexed early.
const indexable = process.env.SITE_INDEXABLE === 'true'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    metadataBase: new URL(siteUrl),
    title: { default: settings.siteName, template: `%s · ${settings.siteName}` },
    description: settings.metaDescription ?? undefined,
    robots: indexable ? undefined : { index: false, follow: false },
    openGraph: { siteName: settings.siteName, locale: 'en_IN', type: 'website' },
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [settings, sebi, draft] = await Promise.all([getSiteSettings(), getSebiDisclosure(), draftMode()])
  const logo = <Logo logo={settings.logo} siteName={settings.siteName} />

  return (
    <html lang="en-IN" className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {draft.isEnabled && (
          <div className="bg-amber text-ink px-4 py-2 text-center text-sm font-medium">
            Previewing unpublished drafts.{' '}
            <Link href="/api/exit-preview" prefetch={false} className="underline underline-offset-4">
              Exit preview
            </Link>
          </div>
        )}
        <SiteHeader logo={logo} navItems={settings.navItems ?? []} loginCta={settings.loginCta} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter logo={logo} settings={settings} sebi={sebi} />
        <Analytics />
      </body>
    </html>
  )
}
