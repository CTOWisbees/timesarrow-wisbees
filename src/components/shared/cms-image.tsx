import Image, { type ImageProps } from 'next/image'

import type { Media } from '@/payload-types'

type CmsImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  media?: number | Media | null
  /** Shown until a content manager uploads the real asset. */
  fallbackSrc: string
  fallbackAlt: string
}

/**
 * Payload returns absolute URLs for local uploads (serverURL is set), which next/image
 * rejects as an unconfigured host. Same-site media is reduced to its relative path;
 * remote storage URLs (Supabase) are left alone.
 */
function relativeMediaUrl(url: string) {
  if (!/^https?:\/\//.test(url)) return url
  try {
    const { pathname, search } = new URL(url)
    return pathname.startsWith('/api/media/file/') ? pathname + search : url
  } catch {
    return url
  }
}

/** Renders an uploaded Payload image, or a labelled placeholder when none is set. */
export function CmsImage({ media, fallbackSrc, fallbackAlt, ...props }: CmsImageProps) {
  const uploaded = typeof media === 'object' && media?.url ? media : null
  const src = uploaded?.url ? relativeMediaUrl(uploaded.url) : fallbackSrc
  const alt = uploaded?.alt ?? fallbackAlt
  const sized =
    !props.fill && uploaded?.width && uploaded?.height
      ? { width: props.width ?? uploaded.width, height: props.height ?? uploaded.height }
      : {}

  return <Image src={src} alt={alt} unoptimized={src.endsWith('.svg')} {...sized} {...props} />
}
