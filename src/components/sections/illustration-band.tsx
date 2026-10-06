import { CmsImage } from '@/components/shared/cms-image'
import type { HomePage } from '@/payload-types'

export function IllustrationBand({ data }: { data: NonNullable<HomePage['illustration']> }) {
  return (
    <div className="bg-mist">
      <CmsImage
        media={data.image}
        fallbackSrc="/placeholders/city.svg"
        fallbackAlt="Illustrated WisBees city with offices, parks and a market board"
        width={1440}
        height={760}
        sizes="100vw"
        className="h-auto w-full"
      />
    </div>
  )
}
