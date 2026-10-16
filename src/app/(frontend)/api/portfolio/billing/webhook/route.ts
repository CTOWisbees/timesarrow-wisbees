import { markPaid, markRefunded, verifyWebhook } from '@/lib/portfolio/server/billing'

/** Razorpay webhook (payment.captured, refund.processed). Configure it in the Razorpay dashboard. */
export async function POST(request: Request) {
  const raw = await request.text()
  if (!verifyWebhook(raw, request.headers.get('x-razorpay-signature'))) return new Response('Invalid signature', { status: 401 })
  const event = JSON.parse(raw) as {
    event: string
    payload: { payment?: { entity: { id: string; order_id: string } }; refund?: { entity: { payment_id: string } } }
  }
  if (event.event === 'payment.captured' && event.payload.payment) {
    await markPaid(event.payload.payment.entity.order_id, event.payload.payment.entity.id)
  } else if (event.event === 'refund.processed' && event.payload.refund) {
    await markRefunded(event.payload.refund.entity.payment_id)
  }
  return Response.json({ ok: true })
}
