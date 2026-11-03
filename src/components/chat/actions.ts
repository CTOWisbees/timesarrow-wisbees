'use server'

import { askCopilot } from '@/components/portal/actions'
import { emptyPortalData } from '@/lib/portal/load'
import { answerWith, type RagAnswer } from '@/lib/rag/answer'
import { getKnowledge } from '@/lib/rag/knowledge'
import { rateLimit } from '@/lib/portfolio/server/rate-limit'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'
import { getCurrentUser } from '@/lib/supabase/server'

const SIGN_IN: RagAnswer['actions'] = [['Sign in', '/login']]

/**
 * The chat widget's one entry point. Signed in, it is the dashboard Copilot over the client's own numbers. Signed out,
 * it answers only from what WisBees has published (plans, fees, how things work), and asks personal questions to sign in.
 * Signed-out answers are not tied to a person, so they are not logged.
 */
export async function askAssistant(question: string): Promise<RagAnswer> {
  const q = String(question ?? '').trim().slice(0, 500)
  if (!q) return { text: 'Type a question and I will help.', sources: [], actions: [], intent: 'error', handedOver: false, confidence: 0, mode: 'none' }

  const user = await getCurrentUser()
  if (user || demoModeEnabled()) return askCopilot(q)

  if (!(await rateLimit('chat', 20))) {
    return { text: 'You are asking quickly. Please wait a minute and try again.', sources: [], actions: [], intent: 'error', handedOver: false, confidence: 0, mode: 'none' }
  }
  const answer = await answerWith({ question: q, data: emptyPortalData(), knowledge: await getKnowledge() })
  if (answer.intent === 'no-data') {
    return { ...answer, text: 'I can explain your own money once you sign in. Until then I can answer questions about WisBees: our plans and fees, how advice works, or how our tools calculate.', sources: [], actions: SIGN_IN }
  }
  return answer
}
