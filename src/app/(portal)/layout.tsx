import type { Metadata } from 'next'

import { sans, serif } from '../fonts'

import '../(frontend)/globals.css'

export const metadata: Metadata = {
  title: { default: 'Your dashboard', template: '%s · WisBees' },
  // Client area: never indexed, whatever SITE_INDEXABLE says.
  robots: { index: false, follow: false },
}

/** Root layout for the signed-in client dashboard: its own full-screen frame, no site header or footer. */
export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${serif.variable}`}>
      <body className="bg-mist" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
