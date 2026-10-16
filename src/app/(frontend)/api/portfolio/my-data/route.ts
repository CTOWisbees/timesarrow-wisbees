import { exportUserData, getViewer } from '@/lib/portfolio/server/store'

/** "Download my data": everything Portfolio Scan stores for the signed-in account, as JSON. */
export async function GET() {
  const viewer = await getViewer()
  if (!viewer.userId) return new Response('Sign in to download your data.', { status: 401 })
  const data = await exportUserData(viewer.userId)
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="wisbees-portfolio-scan-data.json"',
      'Cache-Control': 'no-store',
    },
  })
}
