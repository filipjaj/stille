import type { Metadata } from 'next'

import { Button } from '@/components/stille/Button'
import { Eyebrow } from '@/components/stille/Eyebrow'

import styles from './not-found.module.css'

export const metadata: Metadata = {
  title: 'Siden finnes ikke',
  description: 'Siden du leter etter er flyttet eller finnes ikke lenger.',
}

/**
 * 404-side. Ren presentasjon uten Payload-oppslag — det finnes intet
 * CMS-dokument å hente for en side som per definisjon ikke finnes.
 */
export default function NotFound() {
  return (
    <div className={styles.page}>
      <div>
        <Eyebrow>Siden finnes ikke</Eyebrow>
        <h1 className={styles.big}>404</h1>
        <h2 className={styles.lede}>
          <em>Her var det stille.</em>
        </h2>
        <p className={styles.text}>
          Siden du leter etter er flyttet eller finnes ikke lenger. Lenken kan være gammel, eller
          adressen skrevet feil.
        </p>
        <div className={styles.actions}>
          <Button href="/" icon="arrow-right">
            Til forsiden
          </Button>
          <Button href="/samlingen" variant="secondary" icon="arrow-right">
            Se samlingen
          </Button>
        </div>
      </div>
      <div className={`st-media ${styles.image}`} />
    </div>
  )
}
