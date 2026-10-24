import type { MetadataRoute } from 'next'

import { CALCULATORS } from '@/lib/calculators/registry'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/sebi-disclosure`, changeFrequency: 'monthly', priority: 0.5 },
    ...CALCULATORS.map((c) => ({ url: `${siteUrl}/tools/${c.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ]
}
