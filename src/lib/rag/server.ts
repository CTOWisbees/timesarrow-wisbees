import 'server-only'

import type { PortalData } from '@/lib/portal/types'

import { answerWith, type RagAnswer } from './answer'
import { generate, llmEnabled } from './llm'
import { getKnowledgeIndex } from './knowledge'

export { RAG_VERSION } from './answer'

/** Answers one question for one client, from their own facts and the published knowledge. */
export async function askRag(question: string, data: PortalData): Promise<RagAnswer> {
  return answerWith({ question, data, knowledge: await getKnowledgeIndex(), generate: llmEnabled() ? generate : undefined })
}

