/** Whether a CMS href points off-site (opens in a new tab). */
export const isExternal = (href?: string | null) => Boolean(href && /^https?:\/\//.test(href))

export const linkProps = (href?: string | null) =>
  isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
