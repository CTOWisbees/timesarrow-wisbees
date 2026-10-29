'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import type { Ticket } from '@/lib/portal/store'
import type { PortalData } from '@/lib/portal/types'

type PortalState = {
  name: string
  data: PortalData
  tickets: Ticket[]
  /** Suggestions still waiting for the client's answer. */
  openTodos: number
  answered: (id: string) => 'approved' | 'declined' | undefined
  markAnswered: (id: string, d: 'approved' | 'declined') => void
  toast: string | null
  say: (message: string) => void
}

const Ctx = createContext<PortalState | null>(null)

export function usePortal() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePortal must be used inside PortalProvider')
  return v
}

/** Client side of the dashboard: the data the server loaded, an optimistic layer for answers, and a toast. */
export function PortalProvider({ name, data, tickets, children }: { name: string; data: PortalData; tickets: Ticket[]; children: React.ReactNode }) {
  const [local, setLocal] = useState<Record<string, 'approved' | 'declined'>>({})
  const [toast, setToast] = useState<string | null>(null)

  const say = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((t) => (t === message ? null : t)), 3200)
  }, [])

  const answered = useCallback((id: string) => local[id] ?? data.decisions[id], [local, data.decisions])
  const markAnswered = useCallback((id: string, d: 'approved' | 'declined') => setLocal((prev) => ({ ...prev, [id]: d })), [])

  const value = useMemo(
    () => ({ name, data, tickets, answered, markAnswered, openTodos: data.todos.filter((t) => !(local[t.id] ?? data.decisions[t.id])).length, toast, say }),
    [name, data, tickets, answered, markAnswered, local, toast, say],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
