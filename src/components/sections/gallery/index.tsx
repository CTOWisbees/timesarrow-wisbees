import type { VariantOf } from '@/lib/section-variants'
import type { GalleryItem, HomePage } from '@/payload-types'

import { GalleryCollage } from './collage'
import { GalleryImmersive } from './immersive'
import { GalleryMosaic } from './mosaic'
import { GallerySplit } from './split'

/** The gallery in whichever layout was chosen (CMS, or a dev preview). See `src/lib/section-variants.ts`. */
export function Gallery({
  data,
  items,
  variant,
}: {
  data: HomePage['gallery']
  items: GalleryItem[]
  variant: VariantOf<'gallery'>
}) {
  if (!items.length) return null
  const intervalMs = (data.autoplaySeconds ?? 6) * 1000
  switch (variant) {
    case 'split':
      return <GallerySplit data={data} items={items} intervalMs={intervalMs} />
    case 'collage':
      return <GalleryCollage data={data} items={items} />
    case 'mosaic':
      return <GalleryMosaic data={data} items={items} />
    default:
      return <GalleryImmersive data={data} items={items} intervalMs={intervalMs} />
  }
}
