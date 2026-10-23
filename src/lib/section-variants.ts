/**
 * Alternative designs of the same home page section.
 *
 * - Production shows the variant chosen in the CMS (each section's "Layout" field), so
 *   switching is a publish, not a deploy.
 * - In development, `?variant-<section>=<value>` previews another variant without touching
 *   the CMS. The floating "Variants" menu (dev only) sets it, and the link can be shared
 *   with the team. Production ignores the parameter.
 *
 * To add a variant: add it here, build the component, and render it in that section's
 * switch. The CMS dropdown and the dev menu pick it up from this list.
 */
export const SECTION_VARIANTS = {
  highlights: {
    label: 'Why WisBees',
    anchor: 'why-wisbees',
    variants: [
      { value: 'checklist', label: 'Checklist', hint: 'Two columns of ticked points' },
      { value: 'solar', label: 'Solar system', hint: 'Logo as the sun, points and images orbiting on rings' },
      { value: 'atom', label: 'Atom', hint: 'Logo as the nucleus, one electron ring per point, hover for details' },
    ],
  },
  gallery: {
    label: 'Gallery',
    anchor: 'gallery',
    variants: [
      { value: 'immersive', label: 'Immersive', hint: 'Full-screen photo, controls at the bottom' },
      { value: 'split', label: 'Split', hint: 'Photo beside the text, thumbnails below' },
      { value: 'mosaic', label: 'Mosaic', hint: 'Photo grid, no slideshow' },
      { value: 'collage', label: 'Collage', hint: 'Tinted photo backdrop with a row of photo tiles' },
    ],
  },
  bookCall: {
    label: 'Talk to an expert',
    anchor: 'book-call',
    variants: [
      { value: 'two-step', label: 'Two steps', hint: 'Details first, then an optional day and time' },
      { value: 'one-step', label: 'One step', hint: 'Details and an optional day and time together' },
      { value: 'slot-first', label: 'Calendar tiles', hint: 'Details, then day tiles and time slots' },
      { value: 'ms-bookings', label: 'Microsoft Bookings', hint: 'Our Bookings page, embedded' },
    ],
  },
  onboardingProfile: {
    label: 'Onboarding step 2',
    anchor: 'risk-profile',
    variants: [
      { value: 'focus', label: 'Focus', hint: 'One question per screen, then a review' },
      { value: 'single-page', label: 'Single page', hint: 'All five questions on one scroll' },
      { value: 'conversation', label: 'Conversation', hint: 'Questions arrive as adviser messages' },
    ],
  },
} as const

/**
 * Extra presentation switches per section (dev preview via `?variant-<section>-<key>=a,b`,
 * live value from the CMS). Booking form: which fields show an icon.
 */
export const SECTION_TOGGLES = {
  bookCall: {
    key: 'icons',
    label: 'Field icons',
    options: [
      { value: 'name', label: 'Full name' },
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Phone' },
      { value: 'day', label: 'Day' },
      { value: 'time', label: 'Time' },
    ],
  },
} as const

export type BookCallIcon = (typeof SECTION_TOGGLES)['bookCall']['options'][number]['value']

export const toggleParam = (section: keyof typeof SECTION_TOGGLES) =>
  `variant-${section}-${SECTION_TOGGLES[section].key}`

/** Toggle values to use: a dev preview from the URL ("none" = all off) if present, else the CMS value. */
export function resolveToggles<S extends keyof typeof SECTION_TOGGLES>(
  section: S,
  cmsValue: readonly string[] | null | undefined,
  searchParams: Record<string, string | string[] | undefined>,
) {
  const allowed = SECTION_TOGGLES[section].options.map((o) => o.value as string)
  const preview = searchParams[toggleParam(section)]
  const raw = variantPreviewEnabled() && typeof preview === 'string' ? preview.split(',') : (cmsValue ?? [])
  return raw.filter((v) => allowed.includes(v)) as (typeof SECTION_TOGGLES)[S]['options'][number]['value'][]
}

export type SectionKey = keyof typeof SECTION_VARIANTS
export type VariantOf<S extends SectionKey> = (typeof SECTION_VARIANTS)[S]['variants'][number]['value']

/** Variant previews are a development tool only. */
export const variantPreviewEnabled = () => process.env.NODE_ENV !== 'production'

export const variantParam = (section: SectionKey) => `variant-${section}`

/** CMS select options for a section's "Layout" field. */
export const variantOptions = (section: SectionKey) =>
  SECTION_VARIANTS[section].variants.map(({ value, label, hint }) => ({ value, label: `${label}: ${hint}` }))

const isVariant = <S extends SectionKey>(section: S, value: unknown): value is VariantOf<S> =>
  SECTION_VARIANTS[section].variants.some((v) => v.value === value)

/**
 * The variant to render: a dev preview from the URL if there is one, else the CMS
 * choice, else the first in the list.
 */
export function resolveVariant<S extends SectionKey>(
  section: S,
  cmsValue: string | null | undefined,
  searchParams: Record<string, string | string[] | undefined>,
): VariantOf<S> {
  const preview = searchParams[variantParam(section)]
  if (variantPreviewEnabled() && isVariant(section, preview)) return preview
  if (isVariant(section, cmsValue)) return cmsValue
  return SECTION_VARIANTS[section].variants[0].value as VariantOf<S>
}
