import { HighlightsAtom } from './atom'
import type { HighlightsData } from './types'

/** "Why WisBees": the atom layout, the only one. */
export function Highlights({ data }: { data: HighlightsData }) {
  if (!data.items?.length) return null
  return <HighlightsAtom data={data} />
}
