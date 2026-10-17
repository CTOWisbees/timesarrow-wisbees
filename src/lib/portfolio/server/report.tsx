import 'server-only'

import { Document, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatInr as formatInrSymbol } from '@/lib/format-inr'
import type { PortfolioScan } from '@/payload-types'

import type { ScanView } from '../entitlements'
import type { DragCard, DrawdownCard, RatiosCard, StressCard } from '../paid-cards'

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#10221b' },
  h1: { fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  h2: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 18, marginBottom: 6 },
  muted: { color: '#5b6762' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#dfe3dc' },
  score: { fontSize: 40, fontFamily: 'Helvetica-Bold', color: '#0f6b4c' },
  bar: { height: 8, flexDirection: 'row', marginTop: 4 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 7.5, color: '#5b6762' },
})

// The built-in PDF fonts have no ₹ glyph, so amounts read "Rs 1,23,456".
const formatInr = (n: number) => `${n < 0 ? '-' : ''}Rs ${formatInrSymbol(Math.abs(n), { symbol: false })}`

const pct = (x: number | null | undefined) => (x === null || x === undefined ? '–' : `${(x * 100).toFixed(1)}%`)
const fill = (t: string | null | undefined, v: Record<string, string | number>) => (t ?? '').replace(/\{(\w+)\}/g, (m, k: string) => (v[k] === undefined ? m : String(v[k])))
const COLORS: Record<string, string> = { equity: '#0f8a55', debt: '#2a78d6', gold: '#eda100', cash: '#e87ba4', other: '#4a3aa7' }

function Report({ view, copy }: { view: ScanView; copy: PortfolioScan }) {
  const m = view.summary
  const card = <T,>(id: string) => {
    const c = view.cards.find((x) => x.id === id)
    return c && !c.locked ? (c.data as T | null) : null
  }
  const drag = card<DragCard>('drag')
  const dd = card<DrawdownCard>('drawdown')
  const stress = card<StressCard>('stress')
  const ratios = card<RatiosCard>('ratios')
  return (
    <Document title="WisBees Portfolio Scan report" author="WisBees">
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{copy.title}</Text>
        <Text style={s.muted}>
          Prices as of {view.asOf} · {formatInr(m.totalValue)} · uses {Math.round(m.coverage * 100)}% of your holdings
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 16, gap: 12 }}>
          <Text style={s.score}>{view.score.score}</Text>
          <View style={{ paddingBottom: 6 }}>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>{copy.bands[view.score.band].label}</Text>
            <Text style={s.muted}>out of 100{view.score.range ? ` (likely ${view.score.range[0]} to ${view.score.range[1]})` : ''}</Text>
          </View>
        </View>

        <Text style={s.h2}>Score breakdown</Text>
        {view.score.subScores.map((sub) => (
          <View key={sub.id} style={s.row}>
            <Text>{copy.subScores?.find((x) => x.subScore === sub.id)?.label ?? sub.id}</Text>
            <Text>{sub.score ?? 'Not applicable'}</Text>
          </View>
        ))}

        <Text style={s.h2}>{copy.flagsTitle}</Text>
        {view.flags.shown.length === 0 && <Text>{copy.noFlags}</Text>}
        {view.flags.shown.map((f, i) => {
          const t = copy.flags?.find((x) => x.rule === f.id)
          return (
            <View key={`${f.id}-${i}`} style={{ marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                [{f.severity.toUpperCase()}] {fill(t?.title, f.evidence)}
              </Text>
              {t?.why && <Text style={s.muted}>{t.why}</Text>}
              {f.impactInr !== undefined && <Text>Rupee impact: {formatInr(f.impactInr)}</Text>}
            </View>
          )
        })}

        <Text style={s.h2}>{copy.blocks.allocation}</Text>
        <View style={s.bar}>
          {Object.entries(m.allocation.effective)
            .filter(([, w]) => w > 0.0005)
            .map(([k, w]) => (
              <View key={k} style={{ width: `${w * 100}%`, backgroundColor: COLORS[k] }} />
            ))}
        </View>
        {Object.entries(m.allocation.effective)
          .filter(([, w]) => w > 0.0005)
          .map(([k, w]) => (
            <View key={k} style={s.row}>
              <Text>{k[0].toUpperCase() + k.slice(1)}</Text>
              <Text>
                {pct(w)} · {formatInr(w * m.totalValue)}
              </Text>
            </View>
          ))}

        <Text style={s.h2}>{copy.blocks.holdings}</Text>
        {m.topHoldings.map((h) => (
          <View key={h.name} style={s.row}>
            <Text>{h.name}</Text>
            <Text>{pct(h.weight)}</Text>
          </View>
        ))}

        <Text style={s.h2}>{copy.blocks.risk}</Text>
        <Text>
          {m.volatility.label ? copy.riskLabels[m.volatility.label] : 'Not available'}
          {m.volatility.annual !== null && ` · moves about ${pct(m.volatility.annual)} a year (${view.benchmark.name} ${pct(m.volatility.benchmarkAnnual)})`}
        </Text>
        {m.returns.rate !== null && (
          <Text style={{ marginTop: 4 }}>
            Your return {pct(m.returns.rate)} a year{m.returns.benchmarkRate !== null && ` · ${view.benchmark.name} ${pct(m.returns.benchmarkRate)} a year`}
          </Text>
        )}

        {drag && drag.funds.length > 0 && (
          <>
            <Text style={s.h2}>Expense drag</Text>
            <Text>
              {formatInr(drag.total)} less after {drag.years} years than direct plans (illustration at {pct(drag.assumedReturn)} a year before fees).
            </Text>
          </>
        )}
        {dd && (
          <>
            <Text style={s.h2}>Worst fall</Text>
            <Text>
              -{pct(dd.maxDrawdown)} ({dd.peakDate} to {dd.troughDate}); {view.benchmark.name} -{pct(dd.benchmarkMaxDrawdown)}.
            </Text>
          </>
        )}
        {stress && (
          <>
            <Text style={s.h2}>Stress test</Text>
            {stress.historical.map((h) => (
              <View key={h.id} style={s.row}>
                <Text>{h.label}</Text>
                <Text>{h.loss === null ? 'No data' : formatInr(h.loss)}</Text>
              </View>
            ))}
          </>
        )}
        {ratios && (
          <>
            <Text style={s.h2}>Risk ratios</Text>
            <Text>
              Sharpe {ratios.sharpe.toFixed(2)} · Sortino {ratios.sortino.toFixed(2)} · Beta {ratios.beta.toFixed(2)} · Alpha {(ratios.alpha * 100).toFixed(1)}% a year
            </Text>
          </>
        )}

        <Text style={s.footer} fixed>
          {copy.disclaimer}
        </Text>
      </Page>
    </Document>
  )
}

export function renderReport(view: ScanView, copy: PortfolioScan) {
  return renderToBuffer(<Report view={view} copy={copy} />)
}
