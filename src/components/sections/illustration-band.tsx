import { CmsImage } from '@/components/shared/cms-image'
import type { HomePage } from '@/payload-types'

export function IllustrationBand({ data }: { data: NonNullable<HomePage['illustration']> }) {
  // The band takes the paper colour of the illustration, so its edges do not show.
  return (
    <div className="bg-[#f8f8f6]">
      <CmsImage
        media={data.image}
        fallbackSrc="/brand/city-wisbees-v3.webp"
        fallbackAlt="Illustrated WisBees village: the investment advisory office, WisBees Buzz for IPOs and NFOs, the WBC business carnival and WisBees.com for research, news and insights"
        width={1600}
        height={900}
        sizes="100vw"
        className="h-auto w-full"
      />
    </div>
  )
}
