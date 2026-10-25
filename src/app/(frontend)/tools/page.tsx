import { redirect } from 'next/navigation'

/** There is no separate index: "Tools" opens the SIP calculator, which links to the others. */
export default function ToolsPage() {
  redirect('/tools/sip-calculator')
}
