import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CalculatorView } from '@/components/tools/calculator-view'
import { CalculatorSwitcher } from '@/components/tools/switcher'
import { CALCULATORS, getCalculator } from '@/lib/calculators/registry'

type Params = Promise<{ slug: string }>

export const generateStaticParams = () => CALCULATORS.map((c) => ({ slug: c.slug }))

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const def = getCalculator((await params).slug)
  return def ? { title: def.name, description: def.summary } : {}
}

export default async function ToolPage({ params }: { params: Params }) {
  const { slug } = await params
  const def = getCalculator(slug)
  if (!def) notFound()

  return (
    <>
      <div className="bg-mint border-b">
        <div className="container-page py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
            <Link href="/tools" className="hover:text-primary">
              Tools
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{def.name}</span>
          </nav>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">{def.name}</h1>
          <p className="text-ink-soft mt-3 max-w-2xl text-lg">{def.summary}</p>
          <CalculatorSwitcher activeSlug={def.slug} />
        </div>
      </div>

      <div className="container-page py-8 md:py-12">
        <CalculatorView key={def.slug} slug={def.slug} />
      </div>
    </>
  )
}
