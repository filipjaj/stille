import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

import { createStripeClient, type StripeAdapterConfig } from './index'

/**
 * Bekrefter en ordre etter at kunden er tilbake fra betaling.
 *
 * Klienten er aldri kilden til betalingsstatus. Vi henter PaymentIntent-en fra
 * Stripe og godtar bare `succeeded`. En klient som påstår at betalingen gikk
 * gjennom, blir ikke trodd.
 *
 * Webhooken er den autoritative veien — den kommer uansett om kunden lukker
 * fanen. Denne funksjonen finnes for at kunden skal få se en bekreftelse med
 * en gang, og gjør derfor det samme oppslaget mot samme sannhet.
 */
export const confirmOrder =
  (config: StripeAdapterConfig): PaymentAdapter['confirmOrder'] =>
  async ({ data, req }) => {
    const { payload } = req
    const stripe = createStripeClient(config.secretKey)

    const paymentIntentID =
      typeof data.paymentIntentID === 'string' ? data.paymentIntentID : undefined
    if (!paymentIntentID) {
      throw new Error('Mangler PaymentIntent-ID.')
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID)
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Betalingen er ikke fullført (status: ${paymentIntent.status}).`)
    }

    const transactions = await payload.find({
      collection: 'transactions',
      where: { 'stripe.paymentIntentID': { equals: paymentIntentID } },
      limit: 1,
      req,
    })

    const transaction = transactions.docs[0]
    if (!transaction) {
      throw new Error('Fant ingen transaksjon for denne betalingen.')
    }

    const paidAmount = paymentIntent.amount_received ?? paymentIntent.amount
    if (paidAmount !== transaction.amount) {
      // Samme kontroll som i webhooken. Beløpet skal stemme med det vi regnet
      // ut selv, ikke med det klienten mener det var.
      throw new Error('Beløpet stemmer ikke med ordren. Kontakt kundeservice.')
    }

    const order = await payload.create({
      collection: 'orders',
      data: {
        ...(req.user ? { customer: req.user.id } : {}),
        amount: transaction.amount,
        currency: 'NOK',
        status: 'processing',
        transactions: [transaction.id],
      },
      req,
    })

    return {
      message: 'Ordren er bekreftet.',
      orderID: order.id,
      transactionID: transaction.id,
    }
  }
