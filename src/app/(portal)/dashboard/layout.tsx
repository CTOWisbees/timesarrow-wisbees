import { redirect } from 'next/navigation'

import { PortalShell } from '@/components/portal/shell'
import { loadPortalData } from '@/lib/portal/load'
import { DEMO_USER_ID } from '@/lib/portfolio/server/store'
import { listTickets } from '@/lib/portal/store'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'
import { getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** The client dashboard (Bees Copilot): signed-in users only; local demo mode uses the demo user. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user && !demoModeEnabled()) redirect('/login?next=/dashboard')

  const first = user?.fullName.trim().split(/\s+/)[0] || user?.email.split('@')[0] || 'Meera'
  const name = first.charAt(0).toUpperCase() + first.slice(1)
  const owner = { id: user?.id ?? DEMO_USER_ID, name }
  const [data, tickets] = await Promise.all([loadPortalData(owner), listTickets(owner.id)])

  return (
    <PortalShell name={name} data={data} tickets={tickets}>
      {children}
    </PortalShell>
  )
}
