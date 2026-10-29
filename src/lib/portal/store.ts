import 'server-only'

import { getPayloadClient } from '@/lib/payload'

import type { Goal } from './types'

const db = async () => (await getPayloadClient()).db.pool

type GoalRow = { id: string; name: string; emoji: string; target_amount: string; target_year: number; saved_amount: string; monthly_amount: string }

const toGoal = (r: GoalRow): Goal => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  target: Number(r.target_amount),
  year: r.target_year,
  saved: Number(r.saved_amount),
  monthly: Number(r.monthly_amount),
})

export async function listGoals(ownerId: string): Promise<Goal[]> {
  const { rows } = await (await db()).query<GoalRow>(
    `SELECT id, name, emoji, target_amount, target_year, saved_amount, monthly_amount FROM portal.goals WHERE owner_id = $1 ORDER BY created_at`,
    [ownerId],
  )
  return rows.map(toGoal)
}

export type GoalInput = { name: string; emoji: string; target: number; year: number; saved: number; monthly: number }

export async function createGoal(ownerId: string, g: GoalInput): Promise<string> {
  const { rows } = await (await db()).query<{ id: string }>(
    `INSERT INTO portal.goals (owner_id, name, emoji, target_amount, target_year, saved_amount, monthly_amount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [ownerId, g.name, g.emoji, g.target, g.year, g.saved, g.monthly],
  )
  return rows[0].id
}

export async function updateGoal(ownerId: string, id: string, g: Partial<GoalInput>) {
  await (await db()).query(
    `UPDATE portal.goals SET
       name = COALESCE($3, name), emoji = COALESCE($4, emoji), target_amount = COALESCE($5, target_amount),
       target_year = COALESCE($6, target_year), saved_amount = COALESCE($7, saved_amount), monthly_amount = COALESCE($8, monthly_amount), updated_at = now()
     WHERE id = $1 AND owner_id = $2`,
    [id, ownerId, g.name ?? null, g.emoji ?? null, g.target ?? null, g.year ?? null, g.saved ?? null, g.monthly ?? null],
  )
}

export async function deleteGoal(ownerId: string, id: string) {
  await (await db()).query(`DELETE FROM portal.goals WHERE id = $1 AND owner_id = $2`, [id, ownerId])
}

export type Decision = 'approved' | 'declined'

export async function listDecisions(ownerId: string): Promise<Record<string, Decision>> {
  const { rows } = await (await db()).query<{ suggestion_key: string; decision: Decision }>(`SELECT suggestion_key, decision FROM portal.decisions WHERE owner_id = $1`, [ownerId])
  return Object.fromEntries(rows.map((r) => [r.suggestion_key, r.decision]))
}

/** Records the client's answer once; a second answer to the same suggestion is ignored. */
export async function saveDecision(ownerId: string, key: string, kind: string, decision: Decision, detail: Record<string, unknown>) {
  await (await db()).query(
    `INSERT INTO portal.decisions (owner_id, suggestion_key, kind, decision, detail) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (owner_id, suggestion_key) DO NOTHING`,
    [ownerId, key, kind, decision, JSON.stringify(detail)],
  )
}

export type Ticket = { id: number; topic: string; status: string; createdAt: string }

export async function listTickets(ownerId: string): Promise<Ticket[]> {
  const { rows } = await (await db()).query<{ id: number; topic: string; status: string; created_at: Date }>(
    `SELECT id, topic, status, created_at FROM portal.tickets WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [ownerId],
  )
  return rows.map((r) => ({ id: Number(r.id), topic: r.topic, status: r.status, createdAt: r.created_at.toISOString() }))
}

export async function createTicket(ownerId: string, topic: string, body: string): Promise<number> {
  const { rows } = await (await db()).query<{ id: number }>(`INSERT INTO portal.tickets (owner_id, topic, body) VALUES ($1, $2, $3) RETURNING id`, [ownerId, topic, body.slice(0, 4000)])
  return Number(rows[0].id)
}

export async function logAnswer(
  ownerId: string,
  entry: { question: string; answer: string; intent: string; handedOver: boolean; version: string; sources: { title: string; url: string }[]; confidence: number; mode: string },
) {
  await (await db()).query(
    `INSERT INTO portal.ai_log (owner_id, question, answer, intent, handed_over, version, sources, confidence, mode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [ownerId, entry.question.slice(0, 1000), entry.answer.slice(0, 4000), entry.intent, entry.handedOver, entry.version, JSON.stringify(entry.sources), entry.confidence, entry.mode],
  )
}

/** Everything the dashboard stores for a user, for "download my data". */
export async function exportPortalData(ownerId: string) {
  const pool = await db()
  const [goals, decisions, tickets, answers] = await Promise.all([
    pool.query(`SELECT name, target_amount, target_year, saved_amount, monthly_amount, created_at FROM portal.goals WHERE owner_id = $1`, [ownerId]),
    pool.query(`SELECT kind, decision, detail, decided_at FROM portal.decisions WHERE owner_id = $1`, [ownerId]),
    pool.query(`SELECT topic, body, status, created_at FROM portal.tickets WHERE owner_id = $1`, [ownerId]),
    pool.query(`SELECT question, answer, sources, created_at FROM portal.ai_log WHERE owner_id = $1`, [ownerId]),
  ])
  return { goals: goals.rows, decisions: decisions.rows, tickets: tickets.rows, copilotAnswers: answers.rows }
}

/** Goals and answers go with the account. Tickets and the AI log are kept: complaints and AI outputs are compliance records. */
export async function deletePortalData(ownerId: string) {
  const pool = await db()
  await pool.query(`DELETE FROM portal.goals WHERE owner_id = $1`, [ownerId])
  await pool.query(`DELETE FROM portal.decisions WHERE owner_id = $1`, [ownerId])
}
