import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { Eyebrow } from '@/components/stille/Eyebrow'
import { getPayloadClient } from '@/lib/payload'

import { AuthForm } from './AuthForm'
import styles from './logg-inn.module.css'

export const metadata: Metadata = {
  title: 'Logg inn',
  description: 'Logg inn, opprett konto eller tilbakestill passordet ditt.',
}

/**
 * Todelt innloggingsskjerm. Allerede innlogget → rett videre til /konto i
 * stedet for å vise skjemaet på nytt.
 */
export default async function LoggInnPage() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })

  if (user) {
    redirect('/konto')
  }

  return (
    <div className={styles.split}>
      <div className={`st-media ${styles.image}`} />
      <div className={styles.panel}>
        <Eyebrow>Konto</Eyebrow>
        <h1>
          Velkommen
          <br />
          <em>tilbake.</em>
        </h1>
        <AuthForm />
      </div>
    </div>
  )
}
