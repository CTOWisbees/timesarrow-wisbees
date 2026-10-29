'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { COPILOT_VERSION, answerQuestion, type CopilotAnswer } from '@/lib/portal/copilot'
import { loadPortalData } from '@/lib/portal/load'
import { createGoal, createTicket, deleteGoal, deletePortalData, logAnswer, saveDecision, updateGoal } from '@/lib/portal/store'
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

/** Answers from the client's own numbers and keeps a log of every answer for compliance review. */
export async function askCopilot(question: string): Promise<CopilotAnswer | { text: string; actions: []; intent: 'error'; handedOver: false }> {
  const o = await owner()
  const q = String(question ?? '').trim().slice(0, 500)
  if (!o || !q) return { text: 'Please sign in and type a question.', actions: [], intent: 'error', handedOver: false }
  const answer = answerQuestion(q, await loadPortalData(o))
  await logAnswer(o.id, q, answer.text, answer.intent, answer.handedOver, COPILOT_VERSION)
  return answer
}

/** Deletes the client's saved portfolios, goals and answers. Complaints and the AI log are kept as compliance records. */
export async function deleteMyDashboardData() {
  const o = await owner()
  if (!o) return fail
  await Promise.all([deleteUserData(o.id), deletePortalData(o.id)])
  refresh()
  return { ok: true as const }
}
