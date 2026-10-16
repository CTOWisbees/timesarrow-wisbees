import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

import { getPayloadClient } from '@/lib/payload'

import { setPlan } from './store'

/**
 * Razorpay Orders + Checkout. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and
 * RAZORPAY_WEBHOOK_SECRET (test keys first). Without keys, billing is unavailable,
 * except in local demo mode where a plan can be granted directly.
 *
 * Billing period is not decided yet (monthly, annual or per report): PLAN_DAYS sets
 * how long a purchase lasts, and the CMS price and period label must match it.
 */
export const PLAN_DAYS = 365

const keyId = () => process.env.RAZORPAY_KEY_ID ?? ''
const keySecret = () => process.env.RAZORPAY_KEY_SECRET ?? ''
export const billingConfigured = () => Boolean(keyId() && keySecret())

const db = async () => (await getPayloadClient()).db.pool

export async function createOrder(userId: string, plan: 'insights' | 'pro', amountPaise: number) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')}` },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', notes: { plan } }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status}`)
  const order = (await res.json()) as { id: string; amount: number }
  await (await db()).query(
    `INSERT INTO scan.payments (user_id, plan, amount_paise, status, provider, provider_order_id) VALUES ($1, $2, $3, 'created', 'razorpay', $4)`,
    [userId, plan, order.amount, order.id],
  )
  return { orderId: order.id, amount: order.amount, keyId: keyId() }
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Checkout success handler: signature = HMAC-SHA256(order_id|payment_id, key secret). */
export async function confirmPayment(userId: string, orderId: string, paymentId: string, signature: string) {
  const expected = createHmac('sha256', keySecret()).update(`${orderId}|${paymentId}`).digest('hex')
  if (!safeEqual(expected, signature)) return { ok: false as const }
  return markPaid(orderId, paymentId, userId)
}

/** Webhook: verifies X-Razorpay-Signature over the raw body with the webhook secret. */
export function verifyWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  return safeEqual(createHmac('sha256', secret).update(rawBody).digest('hex'), signature)
}

/** Idempotent: a payment already marked paid is not extended twice. */
export async function markPaid(orderId: string, paymentId: string, userId?: string) {
  const pool = await db()
  const { rows } = await pool.query<{ user_id: string; plan: 'insights' | 'pro' }>(
    `UPDATE scan.payments SET status = 'paid', provider_payment_id = $2, updated_at = now()
     WHERE provider_order_id = $1 AND status <> 'paid' ${userId ? 'AND user_id = $3' : ''}
     RETURNING user_id, plan`,
    userId ? [orderId, paymentId, userId] : [orderId, paymentId],
  )
  const row = rows[0]
  if (!row) return { ok: true as const, already: true }
  await setPlan(row.user_id, row.plan, 'payment', new Date(Date.now() + PLAN_DAYS * 86_400_000))
  return { ok: true as const, plan: row.plan }
}

export async function markRefunded(paymentId: string) {
  const pool = await db()
  const { rows } = await pool.query<{ user_id: string }>(
    `UPDATE scan.payments SET status = 'refunded', updated_at = now() WHERE provider_payment_id = $1 RETURNING user_id`,
    [paymentId],
  )
  // A refund ends the plan; saved portfolios and history stay.
  if (rows[0]) await setPlan(rows[0].user_id, 'free', 'refund', null)
}
