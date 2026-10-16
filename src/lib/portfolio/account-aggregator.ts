/**
 * Account Aggregator (phase 7). Consent-based holdings from depositories and RTAs,
 * replacing file uploads for most users. Needs FIU registration or an AA partner, so
 * nothing is connected yet: `accountAggregator` is null and the entry point on the
 * upload tab is shown disabled.
 *
 * A partner integration implements this interface and returns canonical records, so the
 * rest of the pipeline (resolution, review, scoring) is unchanged.
 */
import type { RawRecord, RawTransaction } from './ingest/types'

export interface AccountAggregatorProvider {
  /** Starts a consent request; the user approves it on the AA's own screens. */
  startConsent(input: { userId: string; returnUrl: string }): Promise<{ consentHandle: string; redirectUrl: string }>
  /** After approval: holdings (and transactions where shared) in our canonical shape. */
  fetchHoldings(consentHandle: string): Promise<{ asOf: string; records: RawRecord[]; transactions: RawTransaction[] }>
  /** The user can revoke consent at any time; data already fetched follows the normal retention rules. */
  revokeConsent(consentHandle: string): Promise<void>
}

export const accountAggregator: AccountAggregatorProvider | null = null
