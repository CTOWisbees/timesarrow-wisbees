'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

export type TranscriptItem = { id: number; from: 'bot' | 'user'; node: ReactNode }

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The messages of a chat-style flow. `bot()` shows a short "typing" pause before each
 * adviser message (none for reduced motion); `user()` adds the visitor's reply.
 */
export function useTranscript() {
  const [items, setItems] = useState<TranscriptItem[]>([])
  const [typing, setTyping] = useState(false)
  const next = useRef(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const add = useCallback((from: TranscriptItem['from'], node: ReactNode) => setItems((all) => [...all, { id: next.current++, from, node }]), [])

  const bot = useCallback(
    async (...nodes: ReactNode[]) => {
      for (const node of nodes) {
        setTyping(true)
        await sleep(reduced() ? 0 : 450)
        if (!alive.current) return
        setTyping(false)
        add('bot', node)
      }
    },
    [add],
  )

  const user = useCallback((node: ReactNode) => add('user', node), [add])

  return { items, typing, bot, user }
}
