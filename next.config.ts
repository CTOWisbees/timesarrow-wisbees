import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/placeholders/**' }, { pathname: '/brand/**' }, { pathname: '/logos/**' }],
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  // Loaded by Node at runtime rather than bundled (PDF report, server-side PDF reading).
  serverExternalPackages: ['@react-pdf/renderer', 'pdfjs-dist'],
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
