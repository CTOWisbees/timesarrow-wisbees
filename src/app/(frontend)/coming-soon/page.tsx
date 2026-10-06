import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Coming soon', robots: { index: false } }

export default function ComingSoonPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">This page is on its way</h1>
      <p className="text-ink-soft mt-4 max-w-lg text-lg">
        We are still building this part of the platform. In the meantime, our team is happy to talk you through it.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="brandOutline" size="cta">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild size="cta">
          <Link href="/#book-call">Talk to an expert</Link>
        </Button>
      </div>
    </div>
  )
}
