import { exportUserData, getViewer } from '@/lib/portfolio/server/store'
import { exportPortalData } from '@/lib/portal/store'

/** "Download my data": everything Portfolio Scan and the dashboard store for the signed-in account, as JSON. */
export async function GET() {
  const viewer = await getViewer()
  if (!viewer.userId) return new Response('Sign in to download your data.', { status: 401 })
  const [data, dashboard] = await Promise.all([exportUserData(viewer.userId), exportPortalData(viewer.userId)])
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), ...data, dashboard }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="wisbees-my-data.json"',
      'Cache-Control': 'no-store',
    },
  })
}
