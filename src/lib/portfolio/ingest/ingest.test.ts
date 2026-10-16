import { describe, expect, it } from 'vitest'

import { mergeRecords, parseCas, parseHoldingLine, statementDate } from './cas'
import { parseCsv } from './table'
import { detectAdapter, headerRow, parseTabular } from './tabular'

// Synthetic files in the published layouts. Replace with anonymised real exports as
// golden files (asserting parsed totals equal the file's own totals).

describe('broker exports', () => {
  it('reads a Zerodha-style holdings CSV with title rows above the header and a totals row', () => {
    const csv = [
      'Holdings statement for client XX1234',
      '',
      'Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.',
      'RELIANCE,10,"2,450.50","2,812.40","28,124.00","3,619.00",14.77%,0.5%',
      'NIFTYBEES,200,240.10,"281.35","56,270.00","8,250.00",17.18%,0.2%',
      'Total,,,,"84,394.00",,,',
    ].join('\n')
    const out = parseTabular([{ name: 'CSV', rows: parseCsv(csv) }])
    expect(out.kind).toBe('parsed')
    if (out.kind !== 'parsed') return
    expect(out.result.source).toBe('zerodha')
    expect(out.result.records).toHaveLength(2)
    expect(out.result.records[0]).toMatchObject({ name: 'RELIANCE', quantity: 10, price: 2812.4, value: 28124, cost: 24505 })
    const total = out.result.records.reduce((s, r) => s + (r.value ?? 0), 0)
    expect(total).toBe(84394)
  })

  it('reads a Groww-style mutual fund export with ISINs', () => {
    const rows = [
      ['Scheme Name', 'AMC', 'Category', 'Sub-category', 'Folio No.', 'Source', 'Units', 'Invested Value', 'Current Value', 'Returns', 'XIRR'],
      ['Parag Parikh Flexi Cap Fund Direct Growth', 'PPFAS', 'Equity', 'Flexi Cap', 'X', 'Groww', '1,234.567', '1,00,000', '1,09,786', '9,786', '12.1%'],
    ]
    const out = parseTabular([{ name: 'Holdings', rows }])
    expect(out.kind).toBe('parsed')
    if (out.kind !== 'parsed') return
    expect(out.result.source).toBe('groww_mf')
    expect(out.result.records[0]).toMatchObject({ quantity: 1234.567, cost: 100000, value: 109786, typeHint: 'mutual_fund' })
  })

  it('asks for a mapping when the layout is unknown', () => {
    const rows = [
      ['Col A', 'Col B', 'Col C'],
      ['Something', '12', '3400'],
    ]
    const out = parseTabular([{ name: 'S', rows }])
    expect(out.kind).toBe('needs_mapping')
  })

  it('uses a remembered mapping for a known header', () => {
    const rows = [
      ['Fund', 'Held', 'Worth'],
      ['Axis Bluechip Fund', '10', '500'],
    ]
    const out = parseTabular([{ name: 'S', rows }], () => ({ name: 0, quantity: 1, value: 2 }))
    expect(out.kind).toBe('parsed')
  })

  it('finds the header among title rows and names the adapter', () => {
    const rows = [['My report'], ['Stock Symbol', 'Company Name', 'ISIN Code', 'Qty', 'Average Cost Price', 'Current Market Price', 'Value At Market Price']]
    const h = headerRow(rows)!
    expect(h.index).toBe(1)
    expect(detectAdapter(rows[1])?.adapter.id).toBe('icici')
  })
})

describe('CAS statements', () => {
  const camsPages = [
    [
      'Consolidated Account Statement',
      'CAMS and KFintech',
      'Statement for the period from 01-Apr-2025 to 09-Oct-2026',
      'Folio No: 1234567 / 89   PAN: XXXXX0000X   KYC: OK',
      'B92Z-Axis Bluechip Fund - Direct Growth - ISIN: INF846K01DP8 (Advisor: DIRECT) Registrar : KFINTECH',
      'Opening Unit Balance: 0.000',
      '10-Apr-2025 Purchase - Systematic 5,000.00 92.345 54.1450 92.345',
      '10-May-2025 Purchase - Systematic 5,000.00 90.101 55.4930 182.446',
      '***Stamp Duty*** 0.25',
      '12-Aug-2025 Redemption (1,000.00) (17.512) 57.1040 164.934',
      'Closing Unit Balance: 164.934 NAV on 09-Oct-2026: INR 60.1234 Total Cost Value: 9,000.00 Market Value on 09-Oct-2026: INR 9,916.39',
    ],
  ]

  it('parses a detailed CAMS/KFintech statement: holdings, cost and transactions', () => {
    const res = parseCas(camsPages, () => 'hash1')!
    expect(res.source).toBe('cams_kfintech_cas')
    expect(res.asOf).toBe('2026-10-09')
    expect(res.records).toEqual([
      expect.objectContaining({ isin: 'INF846K01DP8', name: 'Axis Bluechip Fund - Direct Growth', quantity: 164.934, price: 60.1234, value: 9916.39, cost: 9000, accountHash: 'hash1' }),
    ])
    expect(res.transactions.map((t) => [t.type, t.amount, t.units])).toEqual([
      ['sip', 5000, 92.345],
      ['sip', 5000, 90.101],
      ['sell', 1000, 17.512],
    ])
    // No personal data in the output
    expect(JSON.stringify(res)).not.toContain('1234567')
    expect(JSON.stringify(res)).not.toContain('XXXXX0000X')
  })

  it('reads NSDL-style holding lines by matching quantity × price to value', () => {
    expect(parseHoldingLine('INE002A01018   RELIANCE INDUSTRIES LIMITED   10   2,812.40   28,124.00')).toMatchObject({
      isin: 'INE002A01018',
      name: 'RELIANCE INDUSTRIES LIMITED',
      quantity: 10,
      price: 2812.4,
      value: 28124,
      typeHint: 'equity',
    })
    const nsdl = parseCas([['NSDL Consolidated Account Statement', 'as on 30-Sep-2026', 'INE002A01018 RELIANCE INDUSTRIES LIMITED 10 2,812.40 28,124.00']])!
    expect(nsdl.source).toBe('nsdl_cdsl_cas')
    expect(nsdl.asOf).toBe('2026-09-30')
    expect(nsdl.records).toHaveLength(1)
  })

  it('merges the same ISIN in one account, keeps separate accounts apart', () => {
    const base = { name: 'X', isin: 'INE002A01018', price: null, cost: null, typeHint: 'equity' as const, sourceRef: '' }
    const merged = mergeRecords([
      { ...base, quantity: 5, value: 100, accountHash: 'a' },
      { ...base, quantity: 5, value: 100, accountHash: 'a' },
      { ...base, quantity: 1, value: 20, accountHash: 'b' },
    ])
    expect(merged.map((r) => r.quantity)).toEqual([10, 1])
  })

  it('reads the statement date from either format', () => {
    expect(statementDate('Statement for the period from 01-Apr-2025 to 09-Oct-2026')).toBe('2026-10-09')
    expect(statementDate('Holdings as on 30 Sep 2026')).toBe('2026-09-30')
  })

  it('ignores PDFs that are not statements', () => {
    expect(parseCas([['Contract note', 'Trade date 01-Oct-2026']])).toBeNull()
  })
})
