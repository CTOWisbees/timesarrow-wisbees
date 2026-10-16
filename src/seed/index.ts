/**
 * Seeds the CMS with the Figma copy. Run with `pnpm seed`.
 * Globals are always overwritten; collections are only filled when empty, unless
 * SEED_RESET=true, so content managers' edits are not wiped by accident.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import {
  faqs,
  galleryItems,
  homePage,
  modelPortfolios,
  onboarding,
  riskProfile,
  sebiDisclosure,
  siteSettings,
} from './content'
import { portfolioScan, scanConfig } from './portfolio-scan'

// Runs outside Next.js, so skip the hooks that call revalidatePath.
const context = { disableRevalidate: true }

const payload = await getPayload({ config })
const reset = process.env.SEED_RESET === 'true'

// SEED_ONLY=portfolio-scan,scan-config seeds just those globals and stops, leaving other CMS edits alone.
const only = process.env.SEED_ONLY?.split(',').map((s) => s.trim()).filter(Boolean)
const globals = [
  { slug: 'site-settings', data: siteSettings },
  { slug: 'sebi-disclosure', data: sebiDisclosure },
  { slug: 'home-page', data: homePage },
  { slug: 'onboarding', data: onboarding },
  { slug: 'risk-profile', data: riskProfile },
  { slug: 'portfolio-scan', data: portfolioScan },
  { slug: 'scan-config', data: scanConfig },
] as const
for (const g of globals) {
  if (only && !only.includes(g.slug)) continue
  await payload.updateGlobal({ slug: g.slug, data: { ...g.data, _status: 'published' } as never, context })
}
if (only) {
  payload.logger.info(`Seeded ${only.join(', ')}`)
  process.exit(0)
}
payload.logger.info('Seeded globals')

const seedCollection = async <T extends 'model-portfolios' | 'faqs' | 'gallery-items'>(
  collection: T,
  docs: Record<string, unknown>[],
) => {
  const { totalDocs } = await payload.count({ collection })
  if (totalDocs > 0 && !reset) {
    payload.logger.info(`Skipped ${collection}: already has ${totalDocs} docs (SEED_RESET=true to replace)`)
    return
  }
  if (totalDocs > 0) await payload.delete({ collection, where: { id: { exists: true } }, context })
  for (const data of docs) {
    await payload.create({ collection, data: { ...data, _status: 'published' } as never, context })
  }
  payload.logger.info(`Seeded ${docs.length} ${collection}`)
}

await seedCollection('model-portfolios', modelPortfolios)
await seedCollection('faqs', faqs)
await seedCollection('gallery-items', galleryItems)

// Local test accounts, one per role. Never set SEED_PASSWORD in production.
const adminEmail = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_PASSWORD
if (adminEmail && password && process.env.NODE_ENV !== 'production') {
  const domain = adminEmail.split('@')[1]
  for (const role of ['admin', 'compliance', 'editor'] as const) {
    const email = role === 'admin' ? adminEmail : `${role}@${domain}`
    const existing = await payload.count({ collection: 'users', where: { email: { equals: email } } })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'users', data: { email, password, role, name: `Test ${role}` } })
      payload.logger.info(`Created ${role} user ${email}`)
    }
  }
}

payload.logger.info('Seed complete')
process.exit(0)
