'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

import { Button } from '@/components/stille/Button'
import { Field } from '@/components/stille/Field'
import { TextLink } from '@/components/stille/TextLink'

import styles from './AuthForm.module.css'

type Mode = 'glemt-passord' | 'logg-inn' | 'registrer'

type ErrorPayload = { errors?: { message?: string }[]; message?: string }

/**
 * Ekte Payload-autentisering mot `/api/users/*`. Ingen simulert innlogging —
 * lykkes ikke kallet vises feilmeldingen fra Payload, og brukeren blir
 * værende på siden.
 */
export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = React.useState<Mode>('logg-inn')
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')

    try {
      if (mode === 'logg-inn') {
        const res = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })
        const data: ErrorPayload = await res.json()
        if (!res.ok) {
          throw new Error(data.errors?.[0]?.message || data.message || 'Feil e-post eller passord.')
        }
        router.push('/konto')
        router.refresh()
        return
      }

      if (mode === 'registrer') {
        const createRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, roles: ['customer'] }),
        })
        const createData: ErrorPayload = await createRes.json()
        if (!createRes.ok) {
          throw new Error(
            createData.errors?.[0]?.message || createData.message || 'Kunne ikke opprette konto.',
          )
        }

        const loginRes = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })
        if (!loginRes.ok) {
          throw new Error('Kontoen ble opprettet, men innlogging feilet. Prøv å logge inn.')
        }
        router.push('/konto')
        router.refresh()
        return
      }

      // glemt-passord
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data: ErrorPayload = await res.json().catch(() => ({}))
        throw new Error(data.errors?.[0]?.message || 'Noe gikk galt. Prøv igjen.')
      }
      setNotice('Sjekk e-posten din for en lenke til å tilbakestille passordet.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {mode !== 'glemt-passord' && (
        <nav className={styles.tabs} aria-label="Kontovalg">
          <button
            type="button"
            className={[styles.tab, mode === 'logg-inn' && styles.active].filter(Boolean).join(' ')}
            onClick={() => switchMode('logg-inn')}
          >
            Logg inn
          </button>
          <button
            type="button"
            className={[styles.tab, mode === 'registrer' && styles.active]
              .filter(Boolean)
              .join(' ')}
            onClick={() => switchMode('registrer')}
          >
            Opprett konto
          </button>
        </nav>
      )}

      <form className={styles.form} onSubmit={onSubmit}>
        <Field label="E-post" name="email" type="email" required autoComplete="email" />

        {mode !== 'glemt-passord' && (
          <Field
            label="Passord"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'registrer' ? 'new-password' : 'current-password'}
          />
        )}

        {error ? <p className={styles.error}>{error}</p> : null}
        {notice ? <p>{notice}</p> : null}

        <Button type="submit" fullWidth loading={loading}>
          {mode === 'logg-inn' ? 'Logg inn' : mode === 'registrer' ? 'Opprett konto' : 'Send lenke'}
        </Button>

        {mode === 'logg-inn' ? (
          <TextLink plain onClick={() => switchMode('glemt-passord')}>
            Glemt passord?
          </TextLink>
        ) : null}
        {mode === 'glemt-passord' ? (
          <TextLink plain onClick={() => switchMode('logg-inn')}>
            Tilbake til innlogging
          </TextLink>
        ) : null}
      </form>
    </div>
  )
}
