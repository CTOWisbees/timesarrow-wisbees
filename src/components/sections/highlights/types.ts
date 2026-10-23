import type { HomePage, Media } from '@/payload-types'

export type HighlightsData = HomePage['highlights']
export type HighlightItem = NonNullable<HighlightsData['items']>[number]

/** The uploaded picture of an item, when it has one. */
export const itemImage = (item: HighlightItem): Media | null => (typeof item.image === 'object' && item.image?.url ? item.image : null)

/** The short orbit label, falling back to the full title. */
export const itemLabel = (item: HighlightItem) => item.shortLabel?.trim() || item.title
