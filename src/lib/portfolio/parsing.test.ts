import { describe, expect, it } from 'vitest'

import { parseNavAll, parseNavHistory } from './amfi'
import { classifyCategory, defaultTer } from './categories'
import { findIsin, isValidIsin } from './isin'
import { normalizeName, parseAmount, parseDate } from './numbers'

describe('isValidIsin', () => {
  it('accepts real ISINs', () => {
    for (const isin of ['INE002A01018', 'INF846K01WO1', 'INF179K01BE2', 'US0378331005']) expect(isValidIsin(isin)).toBe(true)
  })
  it('rejects bad check digits and shapes', () => {
    expect(isValidIsin('INE002A01019')).toBe(false)
    expect(isValidIsin('INE002A0101')).toBe(false)
    expect(isValidIsin('1NE002A01018')).toBe(false)
  })
  it('finds an ISIN inside text', () => {
    expect(findIsin('Reliance Industries Ltd (INE002A01018) 10 shares')).toBe('INE002A01018')
    expect(findIsin('no isin here INE002A01019')).toBeNull()
  })
})

describe('parseAmount', () => {
  it.each([
    ['₹12,34,567.89', 1234567.89],
    ['Rs. 1,000', 1000],
    ['(2,500.50)', -2500.5],
    ['1,234-', -1234],
    ['-0.5', -0.5],
    [' 42 ', 42],
    [7, 7],
  ])('%s → %s', (raw, expected) => expect(parseAmount(raw)).toBe(expected))
  it.each(['', '-', 'N/A', 'abc', '1.2.3'])('%s → null', (raw) => expect(parseAmount(raw)).toBeNull())
})

describe('parseDate', () => {
  it.each([
    ['09-Oct-2026', '2026-10-09'],
    ['9 Sep 2026', '2026-09-09'],
    ['09/10/2026', '2026-10-09'],
    ['09-10-26', '2026-10-09'],
    ['2026-10-09', '2026-10-09'],
  ])('%s → %s', (raw, expected) => expect(parseDate(raw)).toBe(expected))
  it('rejects impossible dates', () => {
    expect(parseDate('31-Feb-2026')).toBeNull()
    expect(parseDate('13/13/2026')).toBeNull()
  })
})

describe('normalizeName', () => {
  it('drops punctuation and filler words', () => {
    expect(normalizeName('HDFC Flexi Cap Fund - Direct Plan - Growth Option')).toBe('hdfc flexi cap direct growth')
    expect(normalizeName('Larsen & Toubro Ltd.')).toBe('larsen and toubro')
  })
})

describe('classifyCategory', () => {
  const c = (heading: string, name = '') => classifyCategory(`Open Ended Schemes(${heading})`, name)
  it('treats old and new SEBI names alike', () => {
    expect(c('Equity Scheme - Large Cap Fund').subCategory).toBe('Large Cap')
    expect(c('Equity Schemes - Large Cap Fund').subCategory).toBe('Large Cap')
    expect(c('Equity Scheme - Large & Mid Cap Fund').subCategory).toBe('Large & Mid Cap')
  })
  it('splits hybrids for look-through', () => {
    expect(c('Hybrid Scheme - Aggressive Hybrid Fund').split).toEqual({ equity: 0.7, debt: 0.3 })
    expect(c('Hybrid Scheme - Arbitrage Fund').split).toEqual({ cash: 1 })
  })
  it('reads passive schemes from their names', () => {
    expect(c('Other Scheme - Index Funds', 'Axis Nifty 50 Index Fund').assetClass).toBe('equity')
    expect(c('Other Scheme - Index Funds', 'ABSL Crisil IBX Gilt Apr 2029 Index Fund').assetClass).toBe('debt')
    expect(c('Other Scheme - Other  ETFs', 'Nippon India ETF Gold BeES')).toMatchObject({ assetClass: 'gold', instrumentType: 'etf' })
    expect(c('Exchange Traded Funds (ETFs) - Equity ETF', 'Motilal Oswal Nasdaq 100 ETF').assetClass).toBe('international')
  })
  it('flags thematic funds, including sector index funds', () => {
    expect(c('Equity Scheme - Sectoral/ Thematic').isThematic).toBe(true)
    expect(c('Other Scheme - Index Funds', 'ICICI Prudential Nifty Bank Index Fund').isThematic).toBe(true)
    expect(c('Other Scheme - Index Funds', 'UTI Nifty 50 Index Fund').isThematic).toBe(false)
  })
  it('gives a regular plan a higher default TER than direct', () => {
    const cat = c('Equity Scheme - Flexi Cap Fund')
    expect(defaultTer(cat, 'regular')).toBeGreaterThan(defaultTer(cat, 'direct'))
  })
})

describe('AMFI files', () => {
  const navAll = [
    'Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Plan;Option;Net Asset Value;Date',
    ' ',
    'Open Ended Schemes(Equity Scheme - Flexi Cap Fund)',
    ' ',
    'Axis Mutual Fund',
    ' ',
    '135762;INF846K01WO1;-;Axis Children\'s Fund;Direct Plan;Growth Option;29.0745;09-Oct-2026',
    '135763;INF846K01WS2;INF846K01WQ6;Axis Children\'s Fund;Direct Plan;IDCW Option;26.8335;09-Oct-2026',
    '100001;-;-;Old Scheme;;;N.A.;09-Oct-2026',
  ].join('\n')

  it('parses schemes with their heading, AMC, plan and option', () => {
    const [growth, idcw, old] = parseNavAll(navAll)
    expect(growth).toMatchObject({ amfiCode: 135762, isins: ['INF846K01WO1'], amc: 'Axis Mutual Fund', plan: 'direct', option: 'growth', nav: 29.0745, date: '2026-10-09' })
    expect(growth.category.subCategory).toBe('Flexi Cap')
    expect(idcw.isins).toEqual(['INF846K01WS2', 'INF846K01WQ6'])
    expect(idcw.option).toBe('idcw')
    expect(old).toMatchObject({ isins: [], nav: null, plan: null })
  })

  it('reads NAV history rows', () => {
    const text = [
      'Scheme Code;NAV Name;Plan;Option;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Net Asset Value;Date',
      'Open Ended Schemes ( Money Market )',
      '139619;Taurus Fund - Growth;;;;;10.0000;01-Sep-2026',
      '139619;Taurus Fund - Growth;;;;;0;02-Sep-2026',
    ].join('\n')
    expect([...parseNavHistory(text)]).toEqual([{ amfiCode: 139619, nav: 10, date: '2026-09-01' }])
  })
})

describe('parsePasted', () => {
  it('reads tab-separated rows from a spreadsheet, skipping headers and totals', async () => {
    const { parsePasted } = await import('./paste')
    const rows = parsePasted(
      ['Fund\tUnits\tInvested', 'Parag Parikh Flexi Cap Fund - Direct Growth\t1,234.567\t₹1,00,000', 'INF846K01WO1\t50', 'Reliance Industries Ltd\t10\t25000', 'Total\t\t1,25,000'].join('\n'),
    )
    expect(rows).toEqual([
      { name: 'Parag Parikh Flexi Cap Fund - Direct Growth', isin: null, quantity: 1234.567, amount: 100000, looksLikeStock: false },
      { name: 'INF846K01WO1', isin: 'INF846K01WO1', quantity: 50, amount: null, looksLikeStock: false },
      { name: 'Reliance Industries Ltd', isin: null, quantity: 10, amount: 25000, looksLikeStock: true },
    ])
  })
})
