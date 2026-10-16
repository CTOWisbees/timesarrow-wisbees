import 'server-only'

import { headers } from 'next/headers'

/**
 * Fixed-window rate limit per client IP, kept in memory. Good enough for one server
 * process; on Vercel each instance keeps its own window, so move this to Postgres or
 * a KV store before relying on it in production.
 */
const windows = new Map<string, { start: number; count: number }>()

export async function clientIp() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local'
}

export async function rateLimit(bucket: string, limit: number, windowMs = 60_000): Promise<boolean> {
  const key = `${bucket}:${await clientIp()}`
  const now = Date.now()
  const w = windows.get(key)
  if (!w || now - w.start > windowMs) {
    windows.set(key, { start: now, count: 1 })
    if (windows.size > 10_000) {
      for (const [k, v] of windows) if (now - v.start > windowMs) windows.delete(k)
    }
    return true
  }
  w.count++
  return w.count <= limit
}
