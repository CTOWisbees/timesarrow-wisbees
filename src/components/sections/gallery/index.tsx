import type { GalleryItem, HomePage } from '@/payload-types'

import { GalleryCollage } from './collage'

/** The gallery: the collage layout (the only one in use). */
export function Gallery({ data, items }: { data: HomePage['gallery']; items: GalleryItem[] }) {
  if (!items.length) return null
  return <GalleryCollage data={data} items={items} intervalMs={(data.autoplaySeconds ?? 6) * 1000} />
}
