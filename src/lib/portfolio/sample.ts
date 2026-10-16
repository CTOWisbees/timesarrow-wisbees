import type { PortfolioInput } from './model'

/**
 * The "see a sample result" portfolio. Real instruments (so it scores with live NAVs),
 * chosen to show a few typical flags; it is not a recommendation, and compliance can
 * hide the link (portfolio-scan global → showSample).
 */
export const SAMPLE_PORTFOLIO: PortfolioInput = {
  holdings: [
    { key: 'mf:120716', name: 'UTI Nifty 50 Index Fund', type: 'mutual_fund', quantity: 1500 },
    { key: 'mf:122639', name: 'Parag Parikh Flexi Cap Fund', type: 'mutual_fund', quantity: 2400 },
    { key: 'mf:100119', name: 'HDFC Balanced Advantage Fund', type: 'mutual_fund', quantity: 300 },
    { key: 'eq:INE002A01018', name: 'Reliance Industries Ltd', type: 'equity', quantity: 190, currentValue: 265_000 },
    { key: 'eq:INE040A01034', name: 'HDFC Bank Ltd', type: 'equity', quantity: 90, currentValue: 86_000 },
    { name: 'Savings account', type: 'cash', quantity: 60_000 },
  ],
  holdingPeriod: '3to5',
  benchmarkId: 'NIFTY50_TRI',
  sourceTypes: ['sample'],
}
