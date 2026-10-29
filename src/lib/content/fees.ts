import { FEE_CAP_PER_YEAR } from '@/lib/portal/math'

// Fee text is regulated content: it must be BASL-approved before the site is indexed (see CLAUDE.md).
/** How the fee works: shown on /fees and read by the Copilot. */
export const principles = [
  ['A flat fee, published here', 'You pay a fixed subscription. It does not grow when your investments do.'],
  ['Capped by SEBI', `A fixed fee is limited to ₹${(FEE_CAP_PER_YEAR / 100_000).toFixed(2)} lakh per family per year. Every plan below sits well under it.`],
  ['Nothing to sell', 'We take no commission or trail from any product. You invest in direct plans in your own accounts.'],
  ['Consent before anything', 'Fees are disclosed before you subscribe, and a second opinion on an outside product needs your explicit consent and a documented fee.'],
] as const
