'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { todos } from '@/lib/portal/data'

type Decision = 'Approved' | 'Not now'

type PortalState = {
  name: string
  decisions: Record<string, Decision>
  decide: (id: string, d: Decision) => void
  openTodos: number
  toast: string | null
  say: (message: string) => void
}

const Ctx = createContext<PortalState | null>(null)

export function usePortal() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePortal must be used inside PortalProvider')
  return v
}

/** Client state for the dashboard: which suggestions the client has answered, and a small toast. */
export function PortalProvider({ name, children }: { name: string; children: React.ReactNode }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [toast, setToast] = useState<string | null>(null)

  const say = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((t) => (t === message ? null : t)), 2600)
  }, [])

  const decide = useCallback((id: string, d: Decision) => setDecisions((prev) => ({ ...prev, [id]: d })), [])

  const value = useMemo(
    () => ({ name, decisions, decide, openTodos: todos.filter((t) => !decisions[t.id]).length, toast, say }),
    [name, decisions, decide, toast, say],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
