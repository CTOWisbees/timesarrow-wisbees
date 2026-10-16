/**
 * Bundled logos for common holdings (public/logos, sourced from Wikimedia), matched
 * by company name. A logo uploaded on the holding in the CMS always wins; holdings
 * with neither show their initials.
 */
const logos: Record<string, string> = {
  hdfcbank: 'hdfc-bank',
  reliance: 'reliance',
  relianceindustries: 'reliance',
  tcs: 'tcs',
  tataconsultancyservices: 'tcs',
  infosys: 'infosys',
  icicibank: 'icici-bank',
  lt: 'larsen-toubro',
  larsentoubro: 'larsen-toubro',
  larsenandtoubro: 'larsen-toubro',
}

export function bundledLogo(name: string): string | undefined {
  const key = name.toLowerCase().replace(/\b(ltd|limited)\b/g, '').replace(/[^a-z0-9]/g, '')
  const file = logos[key]
  return file && `/logos/${file}.webp`
}
