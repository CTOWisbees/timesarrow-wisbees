import type { Metadata } from 'next'

import { ScanApp } from '@/components/portfolio-scan/scan-app'
import { toView } from '@/lib/portfolio/entitlements'
import { getScanConfig } from '@/lib/portfolio/server/config'
import { listBenchmarks } from '@/lib/portfolio/server/enrich'
import { getPlan, getViewer, latestPortfolioId, latestResult } from '@/lib/portfolio/server/store'
import { getPortfolioScan } from '@/lib/queries'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getPortfolioScan()
  return { title: copy.title, description: copy.intro, robots: { index: false } }
}

/**
 * Portfolio Scan: add holdings (upload or manual), review, optional details, results.
 * A visitor's latest check (anonymous session or account) is restored on return.
 */
export default async function PortfolioScanPage() {
  const [copy, benchmarks, config, viewer] = await Promise.all([getPortfolioScan(), listBenchmarks(), getScanConfig(), getViewer()])
  const [plan, lastId] = await Promise.all([getPlan(viewer), latestPortfolioId(viewer)])
  const last = lastId ? await latestResult(lastId) : null
  const initialView = lastId && last ? toView(lastId, last.result, plan, plan === 'insights' || plan === 'pro' ? last.paid : null, config.freeFlagsShown) : null

  return (
    <ScanApp
      copy={copy}
      benchmarks={benchmarks}
      initialView={initialView}
      signedIn={Boolean(viewer.userId)}
      demoMode={demoModeEnabled()}
      maxFileMb={config.limits.maxFileMb}
    />
  )
}
