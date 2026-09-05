'use client'

import React from 'react'

import type { Product, User } from '@/payload-types'

/**
 * Lagrede produkter for den innloggede kunden.
 *
 * Lista ligger på `users.saved` i Payload, ikke i nettleseren, så den følger
 * kontoen mellom enheter. Hooken henter den én gang, og skriver tilbake med
 * PATCH når kunden lagrer eller fjerner noe.
 *
 * Er ingen logget inn, er `canSave` false og hjertet skjules — å vise en
 * lagre-knapp som stille ikke lagrer noe ville vært verre enn ingen knapp.
 */
export function useSaved() {
  const [userId, setUserId] = React.useState<number | null>(null)
  const [saved, setSaved] = React.useState<number[]>([])
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    fetch('/api/users/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { user?: User | null }) => {
        if (cancelled || !data.user) return
        setUserId(data.user.id)
        setSaved(
          (data.user.saved ?? []).map((entry: number | Product) =>
            typeof entry === 'number' ? entry : entry.id,
          ),
        )
      })
      .catch(() => {
        // Ikke innlogget, eller API-et er utilgjengelig. Hjertet skjules.
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const toggle = React.useCallback(
    async (productId: number) => {
      if (!userId) return

      const previous = saved
      const next = saved.includes(productId)
        ? saved.filter((id) => id !== productId)
        : [...saved, productId]

      setSaved(next)

      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ saved: next }),
        })
        if (!res.ok) throw new Error(String(res.status))
      } catch {
        // Rull tilbake så hjertet ikke lyver om hva som faktisk er lagret.
        setSaved(previous)
      }
    },
    [saved, userId],
  )

  return {
    /** Sant først når vi vet om noen er innlogget. */
    ready,
    canSave: userId !== null,
    isSaved: (productId: number) => saved.includes(productId),
    toggle,
  }
}
