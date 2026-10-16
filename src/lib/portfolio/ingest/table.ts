/**
 * Reads CSV and XLSX files into plain string grids, one per sheet. Shared by the
 * market-data loaders and the broker-file adapters. Values are strings (or numbers
 * from XLSX cells); interpretation happens in the adapters.
 */
import ExcelJS from 'exceljs'

export type Cell = string | number | null
export type Sheet = { name: string; rows: Cell[][] }

/** RFC 4180-ish CSV: quoted fields, doubled quotes, CRLF/LF, optional BOM. Detects ; and tab delimiters. */
export function parseCsv(text: string): Cell[][] {
  const src = text.replace(/^﻿/, '')
  const firstLine = src.slice(0, src.indexOf('\n') >>> 0)
  const delimiter = [',', ';', '\t'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0]
  const rows: Cell[][] = []
  let row: Cell[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"' && field === '') quoted = true
    else if (ch === delimiter) {
      row.push(field.trim())
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field.trim())
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field !== '' || row.length) {
    row.push(field.trim())
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c !== ''))
}

const cellValue = (v: ExcelJS.CellValue): Cell => {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return v
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object') {
    if ('result' in v) return cellValue(v.result as ExcelJS.CellValue)
    if ('richText' in v) return v.richText.map((t) => t.text).join('').trim()
    if ('text' in v) return String(v.text).trim()
  }
  return null
}

export async function readXlsx(data: ArrayBuffer | Uint8Array): Promise<Sheet[]> {
  const wb = new ExcelJS.Workbook()
  // exceljs is typed for Node's Buffer; a Uint8Array view works at runtime.
  await wb.xlsx.load((data instanceof Uint8Array ? data : new Uint8Array(data)) as unknown as ArrayBuffer)
  return wb.worksheets.map((ws) => {
    const rows: Cell[][] = []
    ws.eachRow({ includeEmpty: false }, (r) => {
      const values = (r.values as ExcelJS.CellValue[]).slice(1).map(cellValue)
      if (values.some((v) => v !== null && v !== '')) rows.push(values)
    })
    return { name: ws.name, rows }
  })
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

export const isZip = (bytes: Uint8Array) => ZIP_MAGIC.every((b, i) => bytes[i] === b)

/** Reads by content, not extension: XLSX is a ZIP; anything else is treated as CSV text. */
export async function readTable(bytes: Uint8Array): Promise<Sheet[]> {
  if (isZip(bytes)) return readXlsx(bytes)
  return [{ name: 'CSV', rows: parseCsv(new TextDecoder('utf-8').decode(bytes)) }]
}

/**
 * Finds the header row: the first row (within the first 30) where at least `min`
 * cells match one of the given patterns. Returns its index and a column lookup.
 */
export function findHeader(rows: Cell[][], patterns: Record<string, RegExp>, min = 3) {
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const cols: Record<string, number> = {}
    rows[r].forEach((cell, c) => {
      const text = String(cell ?? '').trim()
      for (const [key, re] of Object.entries(patterns)) if (cols[key] === undefined && re.test(text)) cols[key] = c
    })
    if (Object.keys(cols).length >= min) return { index: r, cols }
  }
  return null
}
