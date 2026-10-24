import { redirect } from 'next/navigation'

import { CALCULATORS } from '@/lib/calculators/registry'

/** There is no separate index: "Tools" opens the first calculator, which links to the others. */
export default function ToolsPage() {
  redirect(`/tools/${CALCULATORS[0].slug}`)
}
