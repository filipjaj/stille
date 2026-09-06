import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

import { sendOrderConfirmation } from '@/emails/sendOrderConfirmation'

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

    // E-posten sendes etter at ordren er opprettet, og kan ikke velte den:
    // sendOrderConfirmation svelger sine egne feil og logger dem. Kunden har
    // betalt, og ordren finnes — en e-post som ikke går ut skal ikke endre det.
    const recipient =
      transaction.customerEmail ??
      (typeof transaction.customer === 'object' ? transaction.customer?.email : undefined)

    if (recipient) {
      await sendOrderConfirmation({
        payload,
        order,
        email: recipient,
        amounts: {
          // Ordren lagrer bruttototalen. Delsum og frakt er ikke splittet på
          // ordren i dag, så e-posten viser totalen som delsum og fri frakt.
          // Splitten hører hjemme på ordremodellen — se README.
          subtotal: transaction.amount ?? 0,
          shipping: 0,
          total: transaction.amount ?? 0,
        },
      })
    } else {
      payload.logger.warn(`Ordre ${order.id} har ingen e-postadresse — ingen bekreftelse sendt.`)
    }

    return {
      message: 'Ordren er bekreftet.',
      orderID: order.id,
      transactionID: transaction.id,
    }
  }
