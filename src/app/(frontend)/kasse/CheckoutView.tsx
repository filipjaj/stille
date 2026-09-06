'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/stille/Button'
import { usePayments } from '@payloadcms/plugin-ecommerce/client/react'

import { EmptyState } from '@/components/stille/EmptyState'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { Field } from '@/components/stille/Field'
import { RadioGroup, type RadioGroupItem } from '@/components/stille/RadioGroup'
import { formatOre, formatShipping } from '@/lib/format'
import { calculateTotals } from '@/money'
import type { Ore } from '@/money'
import type { Shop } from '@/payload-types'

import {
  cartLinesToMoneyLines,
  resolveShipping,
  useCartLines,
  useCartReady,
  type RawCartItem,
} from '../_shared/cart-lines'
import { StripePayment } from './StripePayment'
import styles from './kasse.module.css'

type CheckoutViewProps = {
  shippingCost: Ore
  freeShippingThreshold?: Ore | null
  paymentMethods: Shop['paymentMethods']
}

const PAYMENT_LABELS: Record<Shop['paymentMethods'][number], string> = {
  vipps: 'Vipps',
  card: 'Kort',
  klarna: 'Klarna',
}

type ShippingMethod = 'posten' | 'hent'

/**
 * Checkout, portert fra designprosjektets `Butikk desktop.dc.html`,
 * data-screen-label="Checkout". Tre nummererte fieldsets — Kontakt, Levering,
 * Betaling — pluss en oppsummering.
 *
 * Kontakt- og leveringsfeltene er ustyrte (ingen betalingsflyt fanger dem opp
 * ennå, se `handleSubmit`), men har `name` klare for den dagen ordren faktisk
 * opprettes.
 */
export function CheckoutView({
  shippingCost,
  freeShippingThreshold,
  paymentMethods,
}: CheckoutViewProps) {
  const { cart, isLoading: cartIsLoading } = useCart()
  const items = (cart?.items ?? []) as RawCartItem[]
  const { lines, isLoading: linesLoading } = useCartLines(items)

  const [shippingMethod, setShippingMethod] = React.useState<ShippingMethod>('posten')
  const [paymentMethod, setPaymentMethod] = React.useState<
    Shop['paymentMethods'][number] | undefined
  >(paymentMethods[0])
  const [paymentNotice, setPaymentNotice] = React.useState<string | null>(null)

  // `cart === undefined` betyr ikke at kurven lastes — for en fersk
  // besøkende finnes den bare ikke. useCartReady skiller de to.
  const cartReady = useCartReady(cart)
  const isLoading = cartIsLoading || !cartReady || linesLoading
  const isEmpty = !isLoading && lines.length === 0

  const itemsGross = lines.reduce((sum, line) => sum + line.lineGross, 0)
  // «Hent i Hamar» er alltid fraktfritt — det er ikke et tall fra
  // shop-globalen, men et bevisst valg for et lokalt henteledd. Posten-prisen
  // følger derimot alltid globalens frakt- og fri frakt-regler.
  const shipping =
    shippingMethod === 'hent'
      ? { gross: 0, vatRate: 25 as const }
      : resolveShipping(itemsGross, { shippingCost, freeShippingThreshold })
  const totals = calculateTotals(cartLinesToMoneyLines(lines), shipping)

  const shippingItems: RadioGroupItem[] = [
    {
      value: 'posten',
      label: 'Posten, hjem',
      trail: formatShipping(
        resolveShipping(itemsGross, { shippingCost, freeShippingThreshold }).gross,
      ),
    },
    { value: 'hent', label: 'Hent i Hamar', trail: 'Fri' },
  ]

  const paymentItems: RadioGroupItem[] = paymentMethods.map((method) => ({
    value: method,
    label: PAYMENT_LABELS[method],
  }))

  const { initiatePayment } = usePayments()
  const [intent, setIntent] = React.useState<{
    clientSecret: string
    paymentIntentID: string
  } | null>(null)
  const [starting, setStarting] = React.useState(false)

  /**
   * Steg 1 av betalingen: serveren regner ut beløpet, oppretter PaymentIntent
   * og en transaksjon, og gir oss en client secret. Selve kortdialogen kommer
   * i steg 2 (`StripePayment`) — vi ber aldri om kortdata selv.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPaymentNotice(null)
    setStarting(true)

    const form = new FormData(event.currentTarget)
    const customerEmail = String(form.get('epost') ?? '')

    try {
      const result = (await initiatePayment('stripe', {
        additionalData: { customerEmail },
      })) as { clientSecret?: string; paymentIntentID?: string } | undefined

      if (!result?.clientSecret || !result.paymentIntentID) {
        throw new Error('Betalingen kunne ikke startes.')
      }

      setIntent({
        clientSecret: result.clientSecret,
        paymentIntentID: result.paymentIntentID,
      })
    } catch (error) {
      setPaymentNotice(
        error instanceof Error
          ? error.message
          : 'Betalingen kunne ikke startes. Prøv igjen, eller ta kontakt med oss.',
      )
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Eyebrow>Kassen</Eyebrow>
        <h1 className={styles.title}>
          Nesten
          <br />
          <em>framme.</em>
        </h1>
      </section>

      {isLoading ? (
        <p className={styles.status}>Henter kurven …</p>
      ) : isEmpty ? (
        <div className={styles.emptyWrap}>
          <EmptyState title="Kurven er tom.">
            Det er ingenting å betale for ennå.{' '}
            <Link href="/samlingen" className={styles.emptyLink}>
              Se objektene.
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className={styles.layout}>
          <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                <span className={styles.legendNo}>01 / </span>Kontakt
              </legend>
              <div className={styles.fieldRow}>
                <Field
                  label="E-post"
                  name="epost"
                  type="email"
                  placeholder="navn@eksempel.no"
                  required
                />
                <Field label="Mobil" name="mobil" type="tel" placeholder="+47" required />
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                <span className={styles.legendNo}>02 / </span>Levering
              </legend>
              <Field label="Navn" name="navn" required />
              <Field label="Adresse" name="adresse" required={shippingMethod === 'posten'} />
              <div className={styles.fieldRowNarrow}>
                <Field
                  label="Postnr"
                  name="postnr"
                  inputMode="numeric"
                  required={shippingMethod === 'posten'}
                />
                <Field label="Sted" name="sted" required={shippingMethod === 'posten'} />
              </div>
              <div className={styles.radioBlock}>
                <RadioGroup
                  boxed
                  value={shippingMethod}
                  onValueChange={(value) => setShippingMethod(value as ShippingMethod)}
                  items={shippingItems}
                  name="leveringsmåte"
                />
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                <span className={styles.legendNo}>03 / </span>Betaling
              </legend>
              {paymentItems.length > 0 ? (
                <RadioGroup
                  boxed
                  value={paymentMethod}
                  // RadioGroup er en generisk streng-komponent i designsystemet, ikke
                  // typeparameterisert — items kommer uansett bare fra shop.paymentMethods.
                  onValueChange={(value) =>
                    setPaymentMethod(value as Shop['paymentMethods'][number])
                  }
                  items={paymentItems}
                  name="betalingsmetode"
                />
              ) : (
                <p className={styles.status}>Ingen betalingsmetoder er satt opp i butikken ennå.</p>
              )}
              <p className={styles.hint}>
                Betalingen fullføres hos leverandøren. Ingen kortdata lagres hos oss.
              </p>
            </fieldset>

            {intent ? (
              <StripePayment
                clientSecret={intent.clientSecret}
                paymentIntentID={intent.paymentIntentID}
                amount={totals.grandTotalGross}
              />
            ) : (
              <div className={styles.submitBlock}>
                <Button
                  type="submit"
                  fullWidth
                  loading={starting}
                  disabled={!paymentMethod || starting}
                >
                  Betal {formatOre(totals.grandTotalGross)}
                </Button>
                {paymentNotice ? (
                  <p role="alert" className={styles.paymentNotice}>
                    {paymentNotice}
                  </p>
                ) : null}
              </div>
            )}
          </form>

          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Din bestilling</h2>
            {lines.map((line) => (
              <div key={line.id} className={styles.summaryLine}>
                {line.image ? (
                  <img src={line.image} alt={line.imageAlt} className={styles.summaryImage} />
                ) : (
                  <div className="st-media" style={{ width: 56, aspectRatio: '4/5' }} />
                )}
                <span>
                  {line.quantity} × {line.title}
                  {line.variantLabel ? (
                    <>
                      <br />
                      <span className={styles.summaryVariant}>{line.variantLabel}</span>
                    </>
                  ) : null}
                </span>
                <span>{formatOre(line.lineGross)}</span>
              </div>
            ))}
            <div className={styles.summaryRow}>
              <span>Frakt</span>
              <span>{formatShipping(totals.shippingGross)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Totalt</span>
              <span>{formatOre(totals.grandTotalGross)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
