import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Account } from '@/components/portal/screens/account'
import { Actions } from '@/components/portal/screens/actions'
import { GoalDetail, GoalsList } from '@/components/portal/screens/goals'
import { Home } from '@/components/portal/screens/home'
import { Money } from '@/components/portal/screens/money'
import { Support } from '@/components/portal/screens/support'
import { goals } from '@/lib/portal/data'

type Params = Promise<{ section?: string[] }>

export const metadata: Metadata = { title: 'Your dashboard' }

/** One route for every dashboard screen: /dashboard, /dashboard/money, /dashboard/goals/college, ... */
export default async function DashboardPage({ params }: { params: Params }) {
  const [slug = '', id] = (await params).section ?? []

  switch (slug) {
    case '':
      return <Home />
    case 'money':
      return <Money />
    case 'goals':
      if (!id) return <GoalsList />
      return goals.some((g) => g.id === id) ? <GoalDetail id={id} /> : notFound()
    case 'todo':
    case 'invest':
    case 'activity':
    case 'tax':
      return <Actions screen={slug} />
    case 'ask':
    case 'talk':
    case 'learn':
    case 'help':
    case 'alerts':
    case 'more':
      return <Support screen={slug} />
    case 'documents':
    case 'family':
    case 'plan':
    case 'privacy':
      return <Account screen={slug} />
    default:
      return notFound()
  }
}
