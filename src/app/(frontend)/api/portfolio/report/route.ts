import { PLAN_RANK, toView } from '@/lib/portfolio/entitlements'
import { getScanConfig } from '@/lib/portfolio/server/config'
import { renderReport } from '@/lib/portfolio/server/report'
import { getPlan, getPortfolio, getViewer, latestResult } from '@/lib/portfolio/server/store'
import { getPortfolioScan } from '@/lib/queries'

export const runtime = 'nodejs'

/** PDF report (Insights and Pro). Built from the same gated view the page shows. */
export async function GET(request: Request) {
  const viewer = await getViewer()
  const id = new URL(request.url).searchParams.get('id') ?? ''
  const portfolio = await getPortfolio(id, viewer)
  if (!portfolio) return new Response('Not found', { status: 404 })
  const plan = await getPlan(viewer)
  if (PLAN_RANK[plan] < PLAN_RANK.insights) return new Response('The PDF report is part of the Insights plan.', { status: 403 })
  const [last, config, copy] = await Promise.all([latestResult(portfolio.id), getScanConfig(), getPortfolioScan()])
  if (!last) return new Response('Not found', { status: 404 })
  const pdf = await renderReport(toView(portfolio.id, last.result, plan, last.paid, config.freeFlagsShown), copy)
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="wisbees-portfolio-report-${last.result.asOf}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
