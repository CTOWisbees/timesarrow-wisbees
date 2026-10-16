import Link from 'next/link'

import { CmsImage } from '@/components/shared/cms-image'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

/** Official logo (public/brand), unless a different one is uploaded in Site settings. */
export function Logo({
  logo,
  siteName,
  className,
}: {
  logo?: number | Media | null
  siteName: string
  className?: string
}) {
  return (
    <Link href="/" aria-label={`${siteName} home`} className={cn('inline-flex shrink-0 items-center', className)}>
      <CmsImage
        media={logo}
        fallbackSrc="/brand/wisbees-logo.png"
        fallbackAlt={siteName}
        width={297}
        height={109}
        priority
        className="h-9 w-auto md:h-10"
      />
    </Link>
  )
}
