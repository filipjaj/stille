'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/stille/Button'
import { EmptyState } from '@/components/stille/EmptyState'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { QuantityStepper } from '@/components/stille/QuantityStepper'
import { TextLink } from '@/components/stille/TextLink'
import { formatOre, formatShipping } from '@/lib/format'
import { calculateTotals } from '@/money'
import type { Ore } from '@/money'

import {
  cartLinesToMoneyLines,
  resolveShipping,
  useCartLines,
  useCartReady,
  type RawCartItem,
} from '../_shared/cart-lines'
import styles from './kurv.module.css'

type CartViewProps = {
  shippingCost: Ore
  freeShippingThreshold?: Ore | null
}

/**
 * Handlekurven, portert fra designprosjektets `Butikk desktop.dc.html`,
 * data-screen-label="Handlekurv".
 *
 * Klientkomponent fordi kurven kommer fra `useCart()` — se Providers.tsx.
 */
export function CartView({ shippingCost, freeShippingThreshold }: CartViewProps) {
  const { cart, isLoading: cartIsLoading, incrementItem, decrementItem, removeItem } = useCart()
  const items = (cart?.items ?? []) as RawCartItem[]
  const { lines, isLoading: linesLoading } = useCartLines(items)

  // `cart === undefined` betyr ikke at kurven lastes — for en fersk
  // besøkende finnes den bare ikke. useCartReady skiller de to.
  const cartReady = useCartReady(cart)
  const isLoading = cartIsLoading || !cartReady || linesLoading
  const isEmpty = !isLoading && lines.length === 0

  const itemsGross = lines.reduce((sum, line) => sum + line.lineGross, 0)
  const totals = calculateTotals(
    cartLinesToMoneyLines(lines),
    resolveShipping(itemsGross, { shippingCost, freeShippingThreshold }),
  )

  const changeQuantity = (line: (typeof lines)[number]) => (next: number) => {
    if (next > line.quantity) void incrementItem(line.id)
    else if (next < line.quantity) void decrementItem(line.id)
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Eyebrow>Handlekurv</Eyebrow>
        <h1 className={styles.title}>
          Dine
          <br />
          <em>utvalgte.</em>
        </h1>
      </section>

      {isLoading ? (
        <p className={styles.status}>Henter kurven …</p>
      ) : isEmpty ? (
        <div className={styles.emptyWrap}>
          <EmptyState title="Kurven er tom.">
            Kanskje noe fra samlingen?{' '}
            <Link href="/samlingen" className={styles.emptyLink}>
              Se objektene.
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.lines}>
            {lines.map((line) => (
              <div key={line.id} className={styles.line}>
                {line.image ? (
                  <img src={line.image} alt={line.imageAlt} className={styles.lineImage} />
                ) : (
                  <div className="st-media" style={{ width: 140, aspectRatio: '4/5' }} />
                )}
                <div className={styles.lineBody}>
                  <div className={styles.lineHead}>
                    <div>
                      <h2 className={styles.lineTitle}>{line.title}</h2>
                      {line.variantLabel ? (
                        <span className={styles.lineVariant}>{line.variantLabel}</span>
                      ) : null}
                    </div>
                    <span className={styles.linePrice}>{formatOre(line.lineGross)}</span>
                  </div>
                  <div className={styles.lineActions}>
                    <QuantityStepper
                      value={line.quantity}
                      min={1}
                      onChange={changeQuantity(line)}
                      label={`Antall, ${line.title}`}
                    />
                    <TextLink plain onClick={(): void => void removeItem(line.id)}>
                      Fjern
                    </TextLink>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Oppsummering</h2>
            <div className={styles.summaryRow}>
              <span>Delsum</span>
              <span>{formatOre(totals.itemsGross)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Frakt</span>
              <span>{formatShipping(totals.shippingGross)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Totalt</span>
              <span>{formatOre(totals.grandTotalGross)}</span>
            </div>
            <p className={styles.note}>
              {freeShippingThreshold != null
                ? `Fri frakt over ${formatOre(freeShippingThreshold)}. Levering 3–5 dager.`
                : 'Levering 3–5 dager.'}
            </p>
            <Button href="/kasse" icon="arrow-right" fullWidth>
              Til kassen
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
