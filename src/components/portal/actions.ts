'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import type { RagAnswer } from '@/lib/rag/answer'
import { coachGoal } from '@/lib/rag/coach'
import { getKnowledge } from '@/lib/rag/knowledge'
import { askRag, RAG_VERSION } from '@/lib/rag/server'
import { loadPortalData } from '@/lib/portal/load'
import { createGoal, createTicket, deleteGoal, deletePortalData, listGoals, logAnswer, saveDecision, updateGoal } from '@/lib/portal/store'
import { deleteUserData } from '@/lib/portfolio/server/store'
import { DEMO_USER_ID } from '@/lib/portfolio/server/store'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'
import { getCurrentUser } from '@/lib/supabase/server'

/** The signed-in client, or the local demo user. Every action is scoped to this id, never to one the browser sends. */
async function owner() {
  const user = await getCurrentUser()
  if (user) return { id: user.id, name: user.fullName.split(/\s+/)[0] || user.email.split('@')[0] }
  if (demoModeEnabled()) return { id: DEMO_USER_ID, name: 'Meera' }
  return null
}

const refresh = () => revalidatePath('/dashboard', 'layout')
const fail = { ok: false as const, error: 'Please sign in again.' }

const thisYear = new Date().getFullYear()
const goalSchema = z.object({
  name: z.string().trim().min(1).max(80),
  emoji: z.string().trim().min(1).max(8).default('🎯'),
  target: z.number().int().positive().max(100_000_000_000),
  year: z.number().int().min(thisYear, 'Pick a year that has not passed').max(thisYear + 60),
  saved: z.number().int().min(0).max(100_000_000_000),
  monthly: z.number().int().min(0).max(10_000_000),
})

export async function addGoal(input: unknown) {
  const o = await owner()
  if (!o) return fail
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Check the goal details.' }
  const id = await createGoal(o.id, parsed.data)
  refresh()
  return { ok: true as const, id }
}

export async function changeGoal(id: string, input: unknown) {
  const o = await owner()
  if (!o) return fail
  const parsed = goalSchema.partial().safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Check the goal details.' }
  await updateGoal(o.id, id, parsed.data)
  refresh()
  return { ok: true as const }
}

export async function removeGoal(id: string) {
  const o = await owner()
  if (!o) return fail
  await deleteGoal(o.id, id)
  refresh()
  return { ok: true as const }
}

/**
 * Records the client's answer to a suggestion. Approving is a recorded instruction to the adviser:
 * WisBees does not hold money or place orders, so nothing is executed here.
 */
export async function answerSuggestion(id: string, decision: 'approved' | 'declined') {
  const o = await owner()
  if (!o) return fail
  const data = await loadPortalData(o)
  const todo = data.todos.find((t) => t.id === id)
  if (!todo) return { ok: false as const, error: 'This suggestion is no longer current. Refresh the page.' }
  await saveDecision(o.id, todo.id, todo.kind, decision, { title: todo.title, details: todo.details, shownAt: new Date().toISOString() })
  refresh()
  return { ok: true as const }
}

const complaintSchema = z.object({ topic: z.string().trim().min(1).max(80), body: z.string().trim().min(1).max(4000) })

export async function fileComplaint(input: unknown) {
  const o = await owner()
  if (!o) return fail
  const parsed = complaintSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Choose a topic and tell us what happened.' }
  const number = await createTicket(o.id, parsed.data.topic, parsed.data.body)
  refresh()
  return { ok: true as const, ticket: `WB-${number}` }
}

/** Answers with the RAG pipeline (the client's own facts plus published knowledge) and logs every answer for compliance review. */
export async function askCopilot(question: string): Promise<RagAnswer> {
  const o = await owner()
  const q = String(question ?? '').trim().slice(0, 500)
  if (!o || !q) return { text: 'Please sign in and type a question.', sources: [], actions: [], intent: 'error', handedOver: false, confidence: 0, mode: 'none' }
  const answer = await askRag(q, await loadPortalData(o))
  await logAnswer(o.id, { question: q, answer: answer.text, intent: answer.intent, handedOver: answer.handedOver, version: RAG_VERSION, sources: answer.sources, confidence: answer.confidence, mode: answer.mode })
  return answer
}

/** The goal coach: the Copilot's words for one goal at the amount and growth rate the client is trying. */
export async function coachGoalAction(goalId: string, monthly: number, annualReturn: number) {
  const o = await owner()
  if (!o) return null
  const goal = (await listGoals(o.id)).find((g) => g.id === goalId)
  if (!goal) return null
  const m = Math.max(0, Math.min(10_000_000, Math.round(Number(monthly) || 0)))
  const r = [0.08, 0.1, 0.12].includes(annualReturn) ? annualReturn : 0.1
  return coachGoal(goal, m, r, await getKnowledge())
}

/** Deletes the client's saved portfolios, goals and answers. Complaints and the AI log are kept as compliance records. */
export async function deleteMyDashboardData() {
  const o = await owner()
  if (!o) return fail
  await Promise.all([deleteUserData(o.id), deletePortalData(o.id)])
  refresh()
  return { ok: true as const }
}
