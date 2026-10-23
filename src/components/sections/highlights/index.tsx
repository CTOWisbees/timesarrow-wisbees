import type { VariantOf } from '@/lib/section-variants'

import { HighlightsAtom } from './atom'
import { HighlightsChecklist } from './checklist'
import { HighlightsSolar } from './solar'
import type { HighlightsData } from './types'

/** "Why WisBees" in whichever layout was chosen (CMS, or a dev preview). See `src/lib/section-variants.ts`. */
export function Highlights({ data, variant }: { data: HighlightsData; variant: VariantOf<'highlights'> }) {
  if (!data.items?.length) return null
  switch (variant) {
    case 'solar':
      return <HighlightsSolar data={data} />
    case 'atom':
      return <HighlightsAtom data={data} />
    default:
      return <HighlightsChecklist data={data} />
  }
}
