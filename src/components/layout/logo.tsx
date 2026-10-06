import Link from 'next/link'

import { CmsImage } from '@/components/shared/cms-image'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

/** Uploaded logo from Site settings, or a typographic wordmark until one is uploaded. */
export function Logo({
  logo,
  siteName,
  className,
}: {
  logo?: number | Media | null
  siteName: string
  className?: string
}) {
  const hasLogo = typeof logo === 'object' && logo?.url
  return (
    <Link href="/" aria-label={`${siteName} home`} className={cn('inline-flex items-center', className)}>
      {hasLogo ? (
        <CmsImage
          media={logo}
          fallbackSrc=""
          fallbackAlt={siteName}
          height={40}
          width={140}
          className="h-10 w-auto"
          priority
        />
      ) : (
        <span className="font-heading text-2xl font-semibold tracking-tight">
          <span className="text-amber">W</span>
          <span className="text-brand-green">is</span>
          <span className="text-ink">Bees</span>
        </span>
      )}
    </Link>
  )
}
