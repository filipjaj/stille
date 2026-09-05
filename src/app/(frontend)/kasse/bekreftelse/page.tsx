import type { Metadata } from 'next'
import React from 'react'

import { Button } from '@/components/stille/Button'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { formatOre } from '@/lib/format'

import styles from './bekreftelse.module.css'

export const metadata: Metadata = {
  title: 'Bekreftelse',
}

type BekreftelsePageProps = {
  searchParams: Promise<{ belop?: string; ordre?: string }>
}

/**
 * Bekreftelse, portert fra designprosjektets `Butikk desktop.dc.html`,
 * data-screen-label="Bekreftelse".
 *
 * Ordrenummeret (og, om det følger med, beløpet som ble betalt) leses fra
 * URL-en — ingen av delene finnes opp her. Det finnes ingen betalingsadapter
 * ennå (milepæl 4a), så det er ingen ekte ordre å slå opp mot ennå; ruten er
 * bygget ferdig til den dagen en fullført betaling faktisk lander her.
 */
export default async function BekreftelsePage({ searchParams }: BekreftelsePageProps) {
  const { belop, ordre } = await searchParams
  const orderNo = ordre || '—'

  const belopOre = belop !== undefined ? Number(belop) : undefined
  const paidLabel = belopOre !== undefined && Number.isFinite(belopOre) ? formatOre(belopOre) : '—'

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Eyebrow>Ordre {orderNo}</Eyebrow>
        <h1 className={styles.title}>
          Takk for
          <br />
          <em>bestillingen.</em>
        </h1>
        <p className={styles.lede}>
          Vi har sendt en bekreftelse på e-post. Objektene pakkes i Hamar og er hos deg om 3–5
          dager.
        </p>
      </section>

      <div className={styles.summary}>
        <div className={styles.row}>
          <span>Ordrenummer</span>
          <span>{orderNo}</span>
        </div>
        <div className={styles.row}>
          <span>Betalt</span>
          <span>{paidLabel}</span>
        </div>
        <div className={styles.row}>
          <span>Levering</span>
          <span>Posten · 3–5 dager</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button href="/journal" variant="secondary" icon="arrow-right">
          Les i journalen
        </Button>
        <Button href="/" variant="secondary">
          Til forsiden
        </Button>
      </div>
    </div>
  )
}
