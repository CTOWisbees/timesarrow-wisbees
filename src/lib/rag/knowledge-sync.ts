import type { Payload } from 'payload'

import type { Chunk } from './bm25'
import { lexicalText } from './lexical'
import { type Db, syncChunks } from './pg-store'
import { staticChunks } from './static-knowledge'

const pub = (id: string, title: string, url: string, text: string, tags: string[] = []): Chunk => ({ id, title, url, text, scope: 'public', tags })

/** Published CMS content only (never drafts), so the shared knowledge can never hold unapproved wording. */
export async function cmsChunks(payload: Payload): Promise<Chunk[]> {
  const out: Chunk[] = []

  const [faqs, sebi, scan] = await Promise.all([
    payload.find({ collection: 'faqs', limit: 100, depth: 0, overrideAccess: false, where: { _status: { equals: 'published' } } }).catch(() => ({ docs: [] })),
    payload.findGlobal({ slug: 'sebi-disclosure', draft: false, depth: 0 }).catch(() => null),
    payload.findGlobal({ slug: 'portfolio-scan', draft: false, depth: 0 }).catch(() => null),
  ])

  for (const f of faqs.docs) out.push(pub(`faq:${f.id}`, f.question, '/#faq', `${f.question} ${lexicalText(f.answer)}`, ['faq']))

  if (sebi) {
    for (const [i, s] of (sebi.complaintSteps ?? []).entries()) out.push(pub(`sebi:step:${i}`, `Complaint step ${i + 1}: ${s.title}`, '/sebi-disclosure', `${s.title}. ${s.text}`, ['complaint', 'grievance', 'escalate']))
    const disclaimers = (sebi.disclaimers ?? []).map((d) => d.text).join(' ')
    if (disclaimers) out.push(pub('sebi:disclaimers', 'SEBI risk disclaimers', '/sebi-disclosure', disclaimers, ['risk', 'disclaimer', 'sebi']))
    if (sebi.sebiRegistrationNumber) out.push(pub('sebi:reg', 'SEBI registration', '/sebi-disclosure', `${sebi.firmName} is registered with SEBI as ${sebi.registrationType ?? 'an Investment Adviser'}, registration number ${sebi.sebiRegistrationNumber}.`, ['registration', 'sebi', 'licence']))
  }

  if (scan) {
    for (const s of scan.subScores ?? []) out.push(pub(`scan:sub:${s.subScore}`, `Score part: ${s.label}`, '/portfolio-scan', `${s.label}. ${s.description}`, ['score', 'health']))
    for (const f of scan.flags ?? []) out.push(pub(`scan:flag:${f.rule}`, `Port Scan flag: ${f.title}`, '/portfolio-scan', `${f.title}. ${f.why}`, ['flag', 'red flag', 'score']))
  }
  return out
}

/** Writes the shipped and published content into the database (Supabase in production). Used by `pnpm rag:index` and on a timer. */
export async function syncKnowledge(db: Db, payload: Payload) {
  const [s, c] = await Promise.all([syncChunks(db, staticChunks(), 'static'), cmsChunks(payload).then((chunks) => syncChunks(db, chunks, 'cms'))])
  return { static: s, cms: c }
}

