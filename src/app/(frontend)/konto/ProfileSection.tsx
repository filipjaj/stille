'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

import { Button } from '@/components/stille/Button'
import { Field } from '@/components/stille/Field'
import { Status } from '@/components/stille/Status'
import { TextLink } from '@/components/stille/TextLink'
import type { User } from '@/payload-types'

import styles from './ProfileSection.module.css'

/**
 * Profil. `users` har kun e-post og roller i datamodellen — det finnes ikke
 * felt for navn — så profilen begrenser seg til visning av e-post,
 * passordbytte og utlogging.
 */
export function ProfileSection({ user }: { user: User }) {
  const router = useRouter()
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const onChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 8) {
      setError('Passordet må være minst 8 tegn.')
      return
    }
    if (password !== confirm) {
      setError('Passordene er ikke like.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })
      const data: { errors?: { message?: string }[] } = await res.json()
      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || 'Kunne ikke oppdatere passordet.')
      }
      setMessage('Passordet er oppdatert.')
      setPassword('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
    } finally {
      setSaving(false)
    }
  }

  const onLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    } finally {
      router.push('/konto/logg-inn')
      router.refresh()
    }
  }

  return (
    <section className={styles.section}>
      <h2>Profil</h2>

      <div className={styles.row}>
        <span>E-post</span>
        <span>{user.email}</span>
      </div>

      <form className={styles.form} onSubmit={onChangePassword}>
        <h3>Bytt passord</h3>
        <Field
          label="Nytt passord"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
        />
        <Field
          label="Gjenta nytt passord"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setConfirm(event.target.value)}
        />
        {error ? <Status fixed={false}>{error}</Status> : null}
        {message ? <Status fixed={false}>{message}</Status> : null}
        <Button type="submit" variant="secondary" loading={saving}>
          Oppdater passord
        </Button>
      </form>

      <TextLink onClick={onLogout} icon="sign-out">
        {loggingOut ? 'Logger ut …' : 'Logg ut'}
      </TextLink>
    </section>
  )
}
