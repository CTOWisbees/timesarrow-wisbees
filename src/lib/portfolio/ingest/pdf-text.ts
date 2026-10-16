/**
 * Turns a PDF into lines of text (per page) with pdf.js, in the browser or on the
 * server. Items on the same baseline become one line; wide gaps become two spaces so
 * column boundaries survive. The password is used only to open the document.
 */
type TextItem = { str: string; transform: number[]; width: number }
type PdfPage = { getTextContent: () => Promise<{ items: unknown[] }> }
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage>; destroy: () => Promise<void> }
export type GetDocument = (src: { data: Uint8Array; password?: string; isEvalSupported?: boolean; disableFontFace?: boolean }) => { promise: Promise<PdfDoc> }

export class PdfPasswordError extends Error {
  constructor(public readonly wrong: boolean) {
    super(wrong ? 'incorrect_password' : 'needs_password')
  }
}

const MAX_PAGES = 200

export async function pdfLines(getDocument: GetDocument, data: Uint8Array, password?: string): Promise<string[][]> {
  let doc: PdfDoc
  try {
    doc = await getDocument({ data, password, isEvalSupported: false, disableFontFace: true }).promise
  } catch (err) {
    const name = (err as { name?: string })?.name
    const code = (err as { code?: number })?.code
    if (name === 'PasswordException') throw new PdfPasswordError(code === 2)
    throw err
  }
  try {
    const pages: string[][] = []
    for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES); n++) {
      const page = await doc.getPage(n)
      const { items } = await page.getTextContent()
      const rows = new Map<number, TextItem[]>()
      for (const raw of items) {
        const it = raw as TextItem
        if (!it.str || !it.transform) continue
        const y = Math.round(it.transform[5] / 2) * 2
        rows.set(y, [...(rows.get(y) ?? []), it])
      }
      const lines = [...rows.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([, its]) => {
          its.sort((a, b) => a.transform[4] - b.transform[4])
          let line = ''
          let end = -Infinity
          for (const it of its) {
            const gap = it.transform[4] - end
            line += line ? (gap > 12 ? '  ' : gap > 1 ? ' ' : '') : ''
            line += it.str
            end = it.transform[4] + it.width
          }
          return line.replace(/\s+$/, '')
        })
        .filter((l) => l.trim())
      pages.push(lines)
    }
    return pages
  } finally {
    await doc.destroy()
  }
}
