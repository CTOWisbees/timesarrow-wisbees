import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Applications } from './payload/collections/Applications'
import { Bookings } from './payload/collections/Bookings'
import { Faqs } from './payload/collections/Faqs'
import { GalleryItems } from './payload/collections/GalleryItems'
import { Media } from './payload/collections/Media'
import { ModelPortfolios } from './payload/collections/ModelPortfolios'
import { Users } from './payload/collections/Users'
import { HomePage } from './payload/globals/HomePage'
import { Onboarding } from './payload/globals/Onboarding'
import { PortfolioScan } from './payload/globals/PortfolioScan'
import { RiskProfile } from './payload/globals/RiskProfile'
import { ScanConfig } from './payload/globals/ScanConfig'
import { SebiDisclosure } from './payload/globals/SebiDisclosure'
import { SiteSettings } from './payload/globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Supabase Storage speaks the S3 protocol. Without credentials (local dev),
// uploads fall back to the ./media folder on disk.
const useS3 = Boolean(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID)

function isLocalDatabase(uri?: string) {
  try {
    return ['localhost', '127.0.0.1', '::1'].includes(new URL(uri ?? '').hostname)
  } catch {
    return false
  }
}

/**
 * Supabase's pooler (port 6543, transaction mode) starts connections with an empty
 * search_path, so Payload cannot find its tables. Asking for `search_path=public` as a startup
 * option fixes it, and is added here so a plain Supabase connection string just works.
 */
function databaseUri(uri?: string) {
  if (!uri || !/pooler\.supabase\.com/.test(uri) || /[?&]options=/.test(uri)) return uri ?? ''
  return `${uri}${uri.includes('?') ? '&' : '?'}options=-c%20search_path%3Dpublic`
}

const previewUrl = (pathname: string) => `${siteUrl}/api/preview?path=${encodeURIComponent(pathname)}`

export default buildConfig({
  serverURL: siteUrl,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' · WisBees CMS',
      icons: [
        { rel: 'icon', type: 'image/png', url: '/brand/wisbees-mark.png' },
        { rel: 'apple-touch-icon', url: '/apple-icon.png' },
      ],
    },
    components: {
      graphics: {
        Logo: '/payload/components/AdminBrand#AdminLogo',
        Icon: '/payload/components/AdminBrand#AdminIcon',
      },
    },
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [ModelPortfolios, Faqs, GalleryItems, Media, Bookings, Applications, Users],
  globals: [
    { ...HomePage, admin: { ...HomePage.admin, preview: () => previewUrl('/') } },
    SiteSettings,
    { ...Onboarding, admin: { ...Onboarding.admin, preview: () => previewUrl('/login') } },
    RiskProfile,
    { ...SebiDisclosure, admin: { ...SebiDisclosure.admin, preview: () => previewUrl('/sebi-disclosure') } },
    { ...PortfolioScan, admin: { ...PortfolioScan.admin, preview: () => previewUrl('/portfolio-scan') } },
    ScanConfig,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    // Serverless: keep each instance's pool small so many instances stay within Supabase's limits.
    pool: { connectionString: databaseUri(process.env.DATABASE_URI), max: Number(process.env.DATABASE_POOL_MAX) || (isLocalDatabase(process.env.DATABASE_URI) ? 10 : 5), idleTimeoutMillis: 10_000 },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Dev pushes schema changes automatically, but only into a local database. Remote
    // databases (Supabase) must only ever change through migrations, or `payload migrate`
    // in the Vercel build will refuse a dev-pushed schema.
    push: process.env.NODE_ENV !== 'production' && isLocalDatabase(process.env.DATABASE_URI),
  }),
  sharp,
  plugins: useS3
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET || 'media',
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || 'ap-south-1',
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
            },
          },
        }),
      ]
    : [],
})
