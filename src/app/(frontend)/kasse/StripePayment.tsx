'use client'

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter } from 'next/navigation'
import React from 'react'

import { Button } from '@/components/stille/Button'
import { formatOre } from '@/lib/format'
import type { Ore } from '@/money'

import styles from './kasse.module.css'

/**
 * Stripe-klienten lastes én gang per side, ikke per render.
 *
 * Nøkkelen er publiserbar og hører hjemme i klienten. Mangler den, returnerer
 * `loadStripe` aldri noe brukbart — vi sjekker derfor eksplisitt og sier fra,
 * i stedet for å vise et betalingsskjema som ikke kan fullføre.
 */
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise: Promise<Stripe | null> | null = publishableKey
  ? loadStripe(publishableKey)
  : null

type StripePaymentProps = {
  clientSecret: string
  paymentIntentID: string
  amount: Ore
}

/**
 * Selve betalingsskjemaet.
 *
 * `PaymentElement` viser de metodene Stripe-kontoen har aktivert — kort,
 * Klarna, og Vipps når previewen er innvilget. Vi lister dem ikke selv; da
 * ville koden og kontoens innstillinger kunne komme i utakt.
 */
function PaymentForm({ paymentIntentID, amount }: Omit<StripePaymentProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const { confirmOrder } = usePayments()
  const router = useRouter()

  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handlePay = async (): Promise<void> => {
    if (!stripe || !elements) return

    setBusy(true)
    setError(null)

    // `redirect: 'if_required'` lar kort fullføre uten omdirigering, mens
    // metoder som krever det (Vipps, Klarna) sendes videre av Stripe selv.
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/kasse/bekreftelse`,
      },
    })

    if (result.error) {
      setError(result.error.message ?? 'Betalingen kunne ikke gjennomføres.')
      setBusy(false)
      return
    }

    try {
      // Ordren opprettes på serveren, som henter betalingsstatus fra Stripe.
      // Klienten får ikke bestemme at noe er betalt.
      const confirmed = (await confirmOrder('stripe', {
        additionalData: { paymentIntentID },
      })) as { orderID?: number | string } | undefined

      const order = confirmed?.orderID ? String(confirmed.orderID) : ''
      router.push(`/kasse/bekreftelse?ordre=${encodeURIComponent(order)}&belop=${amount}`)
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Betalingen gikk gjennom, men ordren kunne ikke bekreftes. Ta kontakt med oss.',
      )
      setBusy(false)
    }
  }

  // Eksplisitt type: `Button` er en diskriminert union, og TypeScript klarer
  // ikke å utlede returtypen på en inline pilfunksjon i onClick der.
  const onPayClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    void handlePay()
  }

  return (
    <div className={styles.submitBlock}>
      <PaymentElement />
      <Button
        type="button"
        fullWidth
        loading={busy}
        disabled={!stripe || busy}
        onClick={onPayClick}
      >
        Betal {formatOre(amount)}
      </Button>
      {error ? (
        <p role="alert" className={styles.paymentNotice}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Rammen rundt betalingsskjemaet, med Stripes kontekst. */
export function StripePayment({ clientSecret, paymentIntentID, amount }: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <p role="status" className={styles.paymentNotice}>
        Betaling er ikke satt opp: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY mangler.
      </p>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: 'nb',
        appearance: {
          // Stille har ingen avrundede hjørner, og bruker papirflate og blekk.
          variables: {
            colorPrimary: '#2f2b23',
            colorBackground: '#fffef2',
            colorText: '#2f2b23',
            borderRadius: '0px',
            fontFamily: 'Stille Sans, Helvetica, Arial, sans-serif',
          },
        },
      }}
    >
      <PaymentForm paymentIntentID={paymentIntentID} amount={amount} />
    </Elements>
  )
}
