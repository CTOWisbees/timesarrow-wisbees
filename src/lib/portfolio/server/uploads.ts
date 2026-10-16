import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

import { getPayloadClient } from '@/lib/payload'

import { parseCas } from '../ingest/cas'
import { type GetDocument, pdfLines } from '../ingest/pdf-text'
import { isZip, readTable } from '../ingest/table'
import { parseTabular } from '../ingest/tabular'
import type { Mapping, ParseResult, RawRecord } from '../ingest/types'
import { getInstruments } from './instruments'
import { resolveHolding } from './enrich'

export type UploadRow = {
  key: string | null
  name: string
  type: 'equity' | 'mutual_fund' | 'etf' | 'bond' | 'cash'
  subCategory: string | null
  plan: 'direct' | 'regular' | null
  option: 'growth' | 'idcw' | null
  isin: string | null
  price: number | null
  priceDate: string | null
  suggestions: { key: string; name: string; plan: string | null; option: string | null; type: string }[]
  quantity: number | null
  currentValue: number | null
  costValue: number | null
  statementPrice: number | null
  accountHash: string | null
  sourceRef: string
}

export type UploadError = 'too_large' | 'wrong_type' | 'unreadable' | 'password' | 'nothing_found' | 'too_many'

const MAGIC_PDF = [0x25, 0x50, 0x44, 0x46] // %PDF

/** Size, type by content (not extension) and macro checks. */
export function checkFile(bytes: Uint8Array, maxMb: number): UploadError | 'pdf' | 'xlsx' | 'csv' {
  if (bytes.byteLength > maxMb * 1024 * 1024) return 'too_large'
  if (MAGIC_PDF.every((b, i) => bytes[i] === b)) return 'pdf'
  if (isZip(bytes)) {
    const head = new TextDecoder('latin1').decode(bytes)
    if (/vbaProject\.bin/i.test(head)) return 'wrong_type' // macro-enabled workbook
    if (!/xl\/workbook\.xml/i.test(head)) return 'wrong_type'
    return 'xlsx'
  }
  // CSV: mostly printable text, no NUL bytes.
  const sample = bytes.subarray(0, 4096)
  if (sample.includes(0)) return 'wrong_type'
  return 'csv'
}

/** Runs a parser with a time limit, so a hostile file cannot hold the server. */
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([p, new Promise<T>((_, reject) => (timer = setTimeout(() => reject(new Error('timeout')), ms)))])
  } finally {
    clearTimeout(timer)
  }
}

const db = async () => (await getPayloadClient()).db.pool
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

async function knownMappings() {
  const { rows } = await (await db()).query<{ header_hash: string; mapping: Mapping }>(`SELECT header_hash, mapping FROM scan.header_mappings`)
  return new Map(rows.map((r) => [r.header_hash, r.mapping]))
}

/** Remembers a confirmed column mapping by a hash of the header row (no user data). */
export async function rememberMapping(signature: string, mapping: Mapping) {
  await (await db()).query(
    `INSERT INTO scan.header_mappings (header_hash, mapping) VALUES ($1, $2)
     ON CONFLICT (header_hash) DO UPDATE SET mapping = EXCLUDED.mapping, uses = scan.header_mappings.uses + 1`,
    [sha(signature), JSON.stringify(mapping)],
  )
}

export async function parseTableFile(bytes: Uint8Array) {
  const sheets = await withTimeout(readTable(bytes), 15_000)
  const known = await knownMappings()
  return parseTabular(sheets, (signature) => known.get(sha(signature)) ?? null)
}

/**
 * drizzle-kit (loaded by Payload's dev schema push) adds an enumerable
 * Array.prototype.random, which pdf.js refuses to run with. Making it non-enumerable
 * keeps it working for drizzle-kit and lets pdf.js start.
 */
function hideArrayPrototypeExtras() {
  for (const key of Object.keys(Array.prototype)) {
    const desc = Object.getOwnPropertyDescriptor(Array.prototype, key)
    if (desc?.enumerable) Object.defineProperty(Array.prototype, key, { ...desc, enumerable: false })
  }
}

/** Server fallback for PDFs (the browser normally reads them, keeping the password on the device). */
export async function parsePdfFile(bytes: Uint8Array, password?: string): Promise<ParseResult | null> {
  hideArrayPrototypeExtras()
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as { getDocument: GetDocument }
  const pages = await withTimeout(pdfLines(pdfjs.getDocument, bytes, password), 30_000)
  // Folio numbers are hashed with a per-request salt: enough to merge within this file, unlinkable afterwards.
  const salt = randomBytes(16).toString('hex')
  return parseCas(pages, (folio) => sha(`${salt}:${folio}`).slice(0, 16))
}

/** Resolves parsed records to instruments for the review table. */
export async function toUploadRows(records: RawRecord[]): Promise<UploadRow[]> {
  const resolutions = await Promise.all(records.map((r) => resolveHolding({ key: null, isin: r.isin, name: r.name, type: r.typeHint ?? (r.isin?.startsWith('INE') ? 'equity' : 'mutual_fund') })))
  const instruments = await getInstruments(resolutions.map((r) => r.key).filter((k): k is string => Boolean(k)))
  return records.map((r, i) => {
    const inst = resolutions[i].key ? instruments.get(resolutions[i].key!) : undefined
    const type = inst?.type ?? r.typeHint ?? 'mutual_fund'
    return {
      key: inst?.key ?? null,
      name: inst?.name ?? r.name,
      type,
      subCategory: inst?.subCategory ?? null,
      plan: inst?.plan ?? null,
      option: inst?.option ?? null,
      isin: inst?.isin ?? r.isin,
      price: inst?.price ?? null,
      priceDate: inst?.priceDate ?? null,
      suggestions: resolutions[i].suggestions,
      quantity: r.quantity,
      // Stocks and unmatched rows are valued from the file until a live price exists.
      currentValue: r.value,
      costValue: r.cost,
      statementPrice: r.price,
      accountHash: r.accountHash,
      sourceRef: r.sourceRef,
    }
  })
}
