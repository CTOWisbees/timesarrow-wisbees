import { CmsImage } from '@/components/shared/cms-image'
import type { HomePage } from '@/payload-types'

export function IllustrationBand({ data }: { data: NonNullable<HomePage['illustration']> }) {
  // The band takes the paper colour of the illustration, so its edges do not show.
  return (
    <div className="bg-[#f9f6ed]">
      <CmsImage
        media={data.image}
        fallbackSrc="/brand/city-wisbees.webp"
        fallbackAlt="Illustrated WisBees village: the investment advisory office, WisBees Buzz for IPOs and NFOs, the WBC business carnival and WisBees.com for research, news and insights"
        width={2000}
        height={1049}
        sizes="100vw"
        className="h-auto w-full"
      />
    </div>
  )
}
