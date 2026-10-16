/**
 * Where to go after signing in. Only same-site paths are allowed ("/x", never "//x" or
 * a full URL), so a crafted link cannot send someone to another site.
 */
export const safeNext = (value: string | null | undefined, fallback = '/onboarding') =>
  value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : fallback

/** Browser only: the `next` parameter of the current page. */
export const nextFromLocation = (fallback = '/onboarding') =>
  typeof window === 'undefined' ? fallback : safeNext(new URLSearchParams(window.location.search).get('next'), fallback)
