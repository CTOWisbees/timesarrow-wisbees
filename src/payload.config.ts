import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Bookings } from './payload/collections/Bookings'
import { Faqs } from './payload/collections/Faqs'
import { GalleryItems } from './payload/collections/GalleryItems'
import { Media } from './payload/collections/Media'
import { ModelPortfolios } from './payload/collections/ModelPortfolios'
import { Users } from './payload/collections/Users'
import { HomePage } from './payload/globals/HomePage'
import { SebiDisclosure } from './payload/globals/SebiDisclosure'
import { SiteSettings } from './payload/globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Supabase Storage speaks the S3 protocol. Without credentials (local dev),
// uploads fall back to the ./media folder on disk.
const useS3 = Boolean(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID)

const previewUrl = (pathname: string) => `${siteUrl}/api/preview?path=${encodeURIComponent(pathname)}`

export default buildConfig({
  serverURL: siteUrl,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · WisBees CMS' },
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [ModelPortfolios, Faqs, GalleryItems, Media, Bookings, Users],
  globals: [
    { ...HomePage, admin: { ...HomePage.admin, preview: () => previewUrl('/') } },
    SiteSettings,
    { ...SebiDisclosure, admin: { ...SebiDisclosure.admin, preview: () => previewUrl('/sebi-disclosure') } },
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Dev pushes schema changes automatically; production applies migrations at build time.
    push: process.env.NODE_ENV !== 'production',
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
