import type { PortalData } from '@/lib/portal/types'

import { Bm25, type Chunk, type Hit, type Retriever } from './bm25'
import { buildFacts } from './facts'
import { MIN_COVERAGE } from './coverage'
import { hasPromise, isAdviceSeeking, numbersGrounded } from './guard'
import { queryTerms, tokens } from './text'

/** Bump when retrieval, ranking or the answer rules change, so a logged answer says which version wrote it. */
export const RAG_VERSION = 'rag-1'

export type Source = { title: string; url: string }
export type RagIntent = 'answer' | 'advice' | 'no-data' | 'low-confidence' | 'smalltalk' | 'error'

export type RagAnswer = {
  text: string
  sources: Source[]
  actions: [string, string][]
  intent: RagIntent
  handedOver: boolean
  /** 0–1. Below the threshold the Copilot hands over to the adviser instead of answering. */
  confidence: number
  mode: 'extractive' | 'llm' | 'none'
}

export type Generator = (question: string, hits: Hit[]) => Promise<string | null>

export const MIN_SCORE = 2.4
const FIRST_PERSON = /\b(my|mine|i|me|am i|do i|have i|i'm|im)\b/i
const ABOUT_US = /\b(you|your|wisbees|bees|plan|plans|plus|essentials|private|subscription|pricing|sebi|flat)\b/i
const SMALLTALK = /^\s*(hi|hello|hey|namaste|good (morning|afternoon|evening)|thanks|thank you|ok|okay)\b[\s!.?]*$/i

const ACTION_LABEL: Record<string, string> = {
  '/dashboard/money': 'See my money',
  '/dashboard/goals': 'See my goals',
  '/dashboard/todo': 'See what to do',
  '/dashboard/tax': 'See Save Tax',
  '/dashboard/invest': 'See Invest',
  '/dashboard/privacy': 'See Privacy',
  '/dashboard/help': 'Help and Complaints',
  '/dashboard/learn': 'See Learn',
  '/dashboard': 'See Home',
  '/portfolio-scan': 'Open Port Scan',
  '/fees': 'See plans and fees',
  '/ai-disclosure': 'How we use AI',
  '/sebi-disclosure': 'SEBI disclosures',
}

const HANDOVER: Pick<RagAnswer, 'actions' | 'handedOver' | 'sources' | 'mode'> = { actions: [['Ask my adviser', '/dashboard/talk']], handedOver: true, sources: [], mode: 'none' }

const sentencesOf = (text: string) => text.match(/.+?(?:[.!?](?=\s|$)|$)\s*/g)?.map((x) => x.trim()).filter(Boolean) ?? [text]

/** The first sentences of a chunk, up to a length, so a long method note does not flood the answer. */
export function lead(text: string, max = 420) {
  let out = ''
  for (const s of sentencesOf(text)) {
    if ((out + s).length > max && out) break
    out += (out ? ' ' : '') + s
  }
  return (out || text).trim()
}

/** The sentences of a chunk that best match the question, kept in their original order, up to a length. */
export function relevant(text: string, question: string, max = 300) {
  const want = new Set(queryTerms(question).filter((t) => t.weight === 1).map((t) => t.term))
  const sentences = sentencesOf(text)
  if (text.length <= max) return text
  const scored = sentences.map((s, i) => ({ s, i, score: tokens(s).filter((t) => want.has(t)).length + (i === 0 ? 0.5 : 0) }))
  const keep = new Set<number>()
  let len = 0
  for (const x of [...scored].sort((a, b) => b.score - a.score || a.i - b.i)) {
    if (len + x.s.length > max && keep.size) continue
    keep.add(x.i)
    len += x.s.length + 1
  }
  return scored.filter((x) => keep.has(x.i)).map((x) => x.s).join(' ')
}

function pick(hits: Hit[]): Hit[] {
  if (!hits.length) return []
  const top = hits[0]
  const chosen = [top]
  for (const h of hits.slice(1)) {
    if (chosen.length >= 3) break
    if (h.chunk.scope === top.chunk.scope && h.score >= top.score * (chosen.length === 1 ? 0.55 : 0.7) && !chosen.some((c) => c.chunk.title === h.chunk.title)) chosen.push(h)
  }
  return chosen
}

const sourcesOf = (hits: Hit[]): Source[] => [...new Map(hits.map((h) => [h.chunk.title, { title: h.chunk.title, url: h.chunk.url }])).values()]
const actionsOf = (sources: Source[]): [string, string][] =>
  [...new Map(sources.map((s) => [s.url.split('#')[0] + (s.url.includes('#faq') ? '#faq' : ''), s])).values()].slice(0, 2).map((s) => [s.url === '/#faq' ? 'See FAQs' : (ACTION_LABEL[s.url.split('#')[0]] ?? 'Read more'), s.url])

/**
 * Retrieval-augmented answer. Retrieve from two stores, the client's own facts (built per request from their
 * data) and the published knowledge, then answer only from what was retrieved. A language model may phrase the
 * answer when one is configured, but only over the retrieved text, and its output is dropped if it adds a number
 * the sources lack or promises returns. Advice-seeking and low-confidence questions go to the adviser.
 */
export async function answerWith({ question, data, knowledge, generate }: { question: string; data: PortalData; knowledge: Retriever; generate?: Generator }): Promise<RagAnswer> {
  const q = question.trim()
  if (!q) return { ...HANDOVER, text: 'Type a question and I will look at your numbers.', actions: [], handedOver: false, intent: 'error', confidence: 0 }
  if (SMALLTALK.test(q)) return { text: 'Hello! Ask me about your money, such as your score, costs, risk or goals, or how something at WisBees works.', sources: [], actions: [], intent: 'smalltalk', handedOver: false, confidence: 1, mode: 'none' }
  if (isAdviceSeeking(q))
    return {
      ...HANDOVER,
      text: 'That sounds like a question for your adviser, who can look at your whole situation. I only explain your own numbers and how WisBees works, and I cannot tell you what to buy or sell. Want to ask them?',
      intent: 'advice',
      confidence: 1,
    }

  const facts = buildFacts(data)
  const clientIndex = new Bm25(facts, { minCoverage: MIN_COVERAGE })
  const personal = FIRST_PERSON.test(q)
  const aboutUs = !personal && ABOUT_US.test(q)

  if (!data.hasPortfolio && personal) {
    const none = facts.find((f) => f.id === 'none')!
    return { text: none.text, sources: [{ title: none.title, url: none.url }], actions: [['Add my holdings', '/portfolio-scan']], intent: 'no-data', handedOver: false, confidence: 1, mode: 'none' }
  }

  const clientHits = clientIndex.search(q, 4).map((h) => ({ ...h, score: h.score * (personal ? 1.3 : aboutUs ? 0.7 : 0.9) }))
  const publicHits = (await knowledge.search(q, 4)).map((h) => ({ ...h, score: h.score * (personal ? 0.9 : aboutUs ? 1.5 : 1.15) }))
  const hits = [...clientHits, ...publicHits].sort((a, b) => b.score - a.score)

  const top = hits[0]?.score ?? 0
  const confidence = Number((top / (top + 4)).toFixed(2))
  if (top < MIN_SCORE)
    return {
      ...HANDOVER,
      text: 'I could not find that in your numbers or in what WisBees has published, so I would rather not guess. Your adviser can answer it properly. Want to ask them?',
      intent: 'low-confidence',
      confidence,
    }

  let chosen = pick(hits)
  const write = (hs: Hit[]) => hs.map((h) => (h.chunk.scope === 'client' ? h.chunk.text : relevant(h.chunk.text, q, 300))).join(' ')
  let extractive = write(chosen)
  // Keep an answer readable: drop the weakest source rather than run past about 650 characters.
  while (extractive.length > 650 && chosen.length > 1) {
    chosen = chosen.slice(0, -1)
    extractive = write(chosen)
  }
  const sources = sourcesOf(chosen)

  let text = extractive
  let mode: RagAnswer['mode'] = 'extractive'
  if (generate) {
    const out = await generate(q, chosen)
    if (out && !hasPromise(out) && numbersGrounded(out.replace(/\[\d+\]/g, ''), chosen.map((h) => h.chunk.text).join(' '))) {
      text = out.replace(/\s*\[\d+\]/g, '')
      mode = 'llm'
    }
  }
  return { text, sources, actions: actionsOf(sources), intent: 'answer', handedOver: false, confidence, mode }
}

/** For tests and callers that only need the retrieved chunks. */
export const retrieve = (question: string, indexes: Bm25[], k = 3): Chunk[] => indexes.flatMap((i) => i.search(question, k)).sort((a, b) => b.score - a.score).slice(0, k).map((h) => h.chunk)
