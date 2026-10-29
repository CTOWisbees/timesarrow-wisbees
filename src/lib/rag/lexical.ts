/** Plain text out of a Payload (Lexical) rich-text value, for indexing. */
export function lexicalText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: unknown; children?: unknown[]; root?: unknown }
  if (n.root) return lexicalText(n.root)
  const own = typeof n.text === 'string' ? n.text : ''
  const kids = Array.isArray(n.children) ? n.children.map(lexicalText).join(' ') : ''
  return `${own} ${kids}`.replace(/\s+/g, ' ').trim()
}
