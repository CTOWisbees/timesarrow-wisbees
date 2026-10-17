import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CalculatorView } from '@/components/tools/calculator-view'
import { panel } from '@/components/tools/results'
import { ToolsSidebar } from '@/components/tools/sidebar'
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
      <div className="bg-card border-b">
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
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <CalculatorView key={def.slug} slug={def.slug} />

          <section className={panel} aria-labelledby="method-title">
            <h2 id="method-title" className="text-xl font-semibold">
              How this is calculated
            </h2>
            <p className="text-ink-soft mt-3 leading-relaxed">{def.method.intro}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {def.method.formulas.map((f) => (
                <li key={f} className="bg-mist text-ink rounded-lg border px-4 py-3 font-mono text-[0.85rem] leading-relaxed">
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-4 text-sm">Figures are estimates for planning. Actual results depend on the product, its terms and market conditions.</p>
          </section>
        </div>
        <ToolsSidebar activeSlug={def.slug} />
      </div>
    </>
  )
}
