import { redirect } from 'next/navigation'

import { PortalShell } from '@/components/portal/shell'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'
import { getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** The client dashboard (Bees Copilot): signed-in users only; local demo mode shows a sample family. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user && !demoModeEnabled()) redirect('/login?next=/dashboard')

  const first = user?.fullName.trim().split(/\s+/)[0] || user?.email.split('@')[0] || 'Meera'
  return (
    <PortalShell name={first.charAt(0).toUpperCase() + first.slice(1)} planLabel="Plus plan">
      {children}
    </PortalShell>
  )
}
