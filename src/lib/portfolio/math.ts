/** Numerical helpers for the engine: root finding, XIRR/CAGR, return series, covariance. */
import type { Series } from './model'

const DAY = 86_400_000
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY)

/** Brent's method on [a, b]; returns null when f(a) and f(b) have the same sign. */
export function brent(f: (x: number) => number, a: number, b: number, tol = 1e-10, maxIter = 200): number | null {
  let fa = f(a)
  let fb = f(b)
  if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) return null
  if (Math.abs(fa) < Math.abs(fb)) {
    ;[a, b, fa, fb] = [b, a, fb, fa]
  }
  let c = a
  let fc = fa
  let d = b - a
  let mflag = true
  for (let i = 0; i < maxIter; i++) {
    if (Math.abs(fb) < tol || Math.abs(b - a) < tol) return b
    let s: number
    if (fa !== fc && fb !== fc) {
      s = (a * fb * fc) / ((fa - fb) * (fa - fc)) + (b * fa * fc) / ((fb - fa) * (fb - fc)) + (c * fa * fb) / ((fc - fa) * (fc - fb))
    } else s = b - (fb * (b - a)) / (fb - fa)
    const cond =
      (s - (3 * a + b) / 4) * (s - b) >= 0 ||
      (mflag && Math.abs(s - b) >= Math.abs(b - c) / 2) ||
      (!mflag && Math.abs(s - b) >= Math.abs(c - d) / 2) ||
      (mflag && Math.abs(b - c) < tol) ||
      (!mflag && Math.abs(c - d) < tol)
    if (cond) {
      s = (a + b) / 2
      mflag = true
    } else mflag = false
    const fs = f(s)
    d = c
    c = b
    fc = fb
    if (fa * fs < 0) {
      b = s
      fb = fs
    } else {
      a = s
      fa = fs
    }
    if (Math.abs(fa) < Math.abs(fb)) {
      ;[a, b, fa, fb] = [b, a, fb, fa]
    }
  }
  return b
}

export type CashFlow = { date: string; amount: number }

/**
 * XIRR: the annual rate r with Σ CF_k / (1+r)^((d_k − d_0)/365) = 0. Investments are
 * negative, withdrawals and the closing value positive. Null if no root in [-0.99, 10].
 */
export function xirr(flows: CashFlow[]): number | null {
  const sorted = flows.filter((f) => f.amount !== 0).sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2 || !sorted.some((f) => f.amount < 0) || !sorted.some((f) => f.amount > 0)) return null
  const d0 = sorted[0].date
  const t = sorted.map((f) => daysBetween(d0, f.date) / 365)
  if (t.at(-1)! <= 0) return null
  const npv = (r: number) => sorted.reduce((sum, f, i) => sum + f.amount / Math.pow(1 + r, t[i]), 0)
  return brent(npv, -0.99, 10)
}

/** CAGR from a single investment date. Under a year, the simple (non-annualised) return. */
export function cagr(value: number, cost: number, days: number): number | null {
  if (cost <= 0 || value < 0 || days <= 0) return null
  if (days < 365) return value / cost - 1
  return Math.pow(value / cost, 365 / days) - 1
}

/** Value of the series on or before `date` (binary search). */
export function valueOn(series: Series, date: string): { date: string; value: number } | null {
  let lo = 0
  let hi = series.dates.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (series.dates[mid] <= date) {
      found = mid
      lo = mid + 1
    } else hi = mid - 1
  }
  return found < 0 ? null : { date: series.dates[found], value: series.values[found] }
}

/**
 * Daily simple returns on the dates common to every series (inner join), using the
 * last `window` common dates. Returns a T×p matrix (rows = days).
 */
export function alignedReturns(series: Series[], window = 252): { dates: string[]; returns: number[][] } {
  if (!series.length) return { dates: [], returns: [] }
  const maps = series.map((s) => new Map(s.dates.map((d, i) => [d, s.values[i]])))
  const common = series[0].dates.filter((d) => maps.every((m) => m.has(d)))
  const dates = common.slice(-(window + 1))
  const returns: number[][] = []
  for (let t = 1; t < dates.length; t++) {
    returns.push(maps.map((m) => m.get(dates[t])! / m.get(dates[t - 1])! - 1))
  }
  return { dates: dates.slice(1), returns }
}

/** Sample mean and standard deviation of a vector. */
export function meanStd(xs: number[], sample = true) {
  const n = xs.length
  if (!n) return { mean: 0, std: 0 }
  const mean = xs.reduce((a, b) => a + b, 0) / n
  const v = xs.reduce((a, x) => a + (x - mean) ** 2, 0) / (sample && n > 1 ? n - 1 : n)
  return { mean, std: Math.sqrt(v) }
}

/**
 * Ledoit-Wolf (2003) shrinkage toward the constant-correlation target: keeps each
 * asset's own variance and shrinks pairwise correlations toward their average. Input is
 * T×p returns; output is the p×p daily covariance and the shrinkage intensity.
 */
export function ledoitWolf(returns: number[][]): { cov: number[][]; shrinkage: number } {
  const T = returns.length
  const p = returns[0]?.length ?? 0
  if (!T || !p) return { cov: [], shrinkage: 0 }
  const means = Array.from({ length: p }, (_, j) => returns.reduce((s, r) => s + r[j], 0) / T)
  const X = returns.map((r) => r.map((v, j) => v - means[j]))
  const S = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0) / T))
  if (p === 1 || T < 3) return { cov: S, shrinkage: 0 }

  const sd = S.map((row, i) => Math.sqrt(row[i]))
  let rSum = 0
  for (let i = 0; i < p; i++) for (let j = i + 1; j < p; j++) rSum += sd[i] && sd[j] ? S[i][j] / (sd[i] * sd[j]) : 0
  const rBar = (2 * rSum) / (p * (p - 1))
  const F = S.map((row, i) => row.map((s, j) => (i === j ? s : rBar * sd[i] * sd[j])))

  // π: asymptotic variance of the sample covariance entries; ρ: covariance with the target; γ: misspecification.
  let pi = 0
  let rho = 0
  let gamma = 0
  const piMat = Array.from({ length: p }, () => new Array<number>(p).fill(0))
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let acc = 0
      for (let t = 0; t < T; t++) acc += (X[t][i] * X[t][j] - S[i][j]) ** 2
      piMat[i][j] = acc / T
      pi += piMat[i][j]
      gamma += (F[i][j] - S[i][j]) ** 2
    }
  }
  for (let i = 0; i < p; i++) rho += piMat[i][i]
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      if (i === j || !sd[i] || !sd[j]) continue
      let thetaII = 0
      let thetaJJ = 0
      for (let t = 0; t < T; t++) {
        const xij = X[t][i] * X[t][j] - S[i][j]
        thetaII += (X[t][i] ** 2 - S[i][i]) * xij
        thetaJJ += (X[t][j] ** 2 - S[j][j]) * xij
      }
      rho += (rBar / 2) * ((sd[j] / sd[i]) * (thetaII / T) + (sd[i] / sd[j]) * (thetaJJ / T))
    }
  }
  const kappa = gamma > 0 ? (pi - rho) / gamma : 0
  const shrinkage = Math.max(0, Math.min(1, kappa / T))
  return { cov: S.map((row, i) => row.map((s, j) => shrinkage * F[i][j] + (1 - shrinkage) * s)), shrinkage }
}

/** w'Σw */
export function quadForm(w: number[], cov: number[][]): number {
  let total = 0
  for (let i = 0; i < w.length; i++) for (let j = 0; j < w.length; j++) total += w[i] * w[j] * cov[i][j]
  return total
}

/** Linear interpolation score: 0 at `bad`, 100 at `good`, clamped. Works in either direction. */
export function interp(x: number, bad: number, good: number): number {
  if (good === bad) return x >= good ? 100 : 0
  return 100 * Math.min(1, Math.max(0, (x - bad) / (good - bad)))
}
