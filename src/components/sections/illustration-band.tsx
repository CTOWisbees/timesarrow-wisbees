import Image from 'next/image'

import type { HomePage } from '@/payload-types'

export function IllustrationBand({ data: _data }: { data: NonNullable<HomePage['illustration']> }) {
  // The village sketch is fixed artwork that ships with the site, so it does not depend on a CMS upload.
  // The band takes the paper colour of the sketch, so its edges do not show.
  return (
    <div className="bg-[#f8f8f6]">
      <Image
        src="/brand/city-wisbees-v3.webp"
        alt="Illustrated WisBees village: the investment advisory office, WisBees Buzz for IPOs and NFOs, the WBC business carnival and WisBees.com for research, news and insights"
        width={1600}
        height={900}
        sizes="100vw"
        className="h-auto w-full"
      />
    </div>
  )
}
