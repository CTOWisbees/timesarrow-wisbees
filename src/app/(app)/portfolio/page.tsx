import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Dashboard } from '@/components/portfolio-scan/dashboard'
import { toView } from '@/lib/portfolio/entitlements'
import { getScanConfig } from '@/lib/portfolio/server/config'
import {
  claimSessionPortfolios,
  getPlan,
  getPortfolio,
  getPreferences,
  getViewer,
  latestResult,
  listAlerts,
  listPortfolios,
  recentlyClaimed,
  scoreHistory,
} from '@/lib/portfolio/server/store'
import { getPortfolioScan } from '@/lib/queries'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'

export const metadata: Metadata = { title: 'Your portfolio' }
export const dynamic = 'force-dynamic'

/**
 * Signed-in Portfolio Scan dashboard. On arrival, a check made before signing in is
 * claimed (attached to the account), so nothing is lost at sign-up.
 */
export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const viewer = await getViewer()
  if (!viewer.userId) redirect('/login?next=/portfolio')

  const plan = await getPlan(viewer)
  await claimSessionPortfolios(viewer, plan)
  const [{ id }, copy, config, portfolios, prefs, alerts, justSaved] = await Promise.all([
    searchParams,
    getPortfolioScan(),
    getScanConfig(),
    listPortfolios(viewer.userId),
    getPreferences(viewer.userId),
    listAlerts(viewer.userId),
    // Navigating here from the site is a full page load (different root layout), so the
    // page can render twice; the banner keys off the claim time rather than this render.
    recentlyClaimed(viewer.userId),
  ])
  if (!portfolios.length) redirect('/portfolio-scan')

  const current = (id && portfolios.find((p) => p.id === id)) || portfolios[0]
  const [portfolio, last, history] = await Promise.all([getPortfolio(current.id, viewer), latestResult(current.id), scoreHistory(current.id)])
  if (!portfolio || !last) redirect('/portfolio-scan')

  return (
    <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <Dashboard
        key={`${current.id}-${plan}-${last.id}`}
        copy={copy}
        view={toView(current.id, last.result, plan, last.paid, config.freeFlagsShown)}
        portfolios={portfolios}
        currentId={current.id}
        name={portfolio.name}
        history={history}
        prefs={prefs}
        alerts={alerts}
        plan={plan}
        justSaved={justSaved}
        demoMode={demoModeEnabled() && viewer.demo}
      />
    </div>
  )
}
