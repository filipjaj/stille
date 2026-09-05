import type { Endpoint } from 'payload'
import Stripe from 'stripe'

import { createStripeClient, type StripeAdapterConfig } from './index'

/**
 * Webhook-endepunktet: `/api/payments/stripe/webhooks`.
 *
 * To ting her er ikke valgfrie.
 *
 * **`constructEventAsync`, ikke `constructEvent`.** Den synkrone varianten
 * kaster på Cloudflare Workers — «SubtleCryptoProvider cannot be used in a
 * synchronous context» — fordi Web Crypto er asynkron. Verifisert i workerd,
 * ikke antatt. Pluginens egen adapter bruker den synkrone og svarer 400 på
 * unntaket, slik at Stripe retry-er i det uendelige uten at noe blir bekreftet.
 *
 * **Idempotens via `webhook_events`.** D1 gir oss ingen transaksjoner, så vi
 * kan ikke skrive ordre og transaksjon atomisk. I stedet skrives hendelsens ID
 * først, mot en sammensatt unik indeks på (provider, eventId). Et duplikat
 * feiler der og returnerer 200 uten sideeffekt — at-most-once uten låsing.
 */
export const webhooksEndpoint = (config: StripeAdapterConfig): Endpoint => ({
  method: 'post',
  path: '/webhooks',
  handler: async (req) => {
    const { payload } = req

    if (!config.webhookSecret) {
      payload.logger.error('Stripe-webhook mottatt, men STRIPE_WEBHOOKS_SIGNING_SECRET mangler.')
      return Response.json({ received: false }, { status: 500 })
    }

    const signature = req.headers.get('stripe-signature')
    if (!signature || !req.text) {
      return Response.json({ received: false }, { status: 400 })
    }

    const body = await req.text()
    const stripe = createStripeClient(config.secretKey)

    let event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        config.webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider(),
      )
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: 'Kunne ikke verifisere signaturen på Stripe-webhooken.',
      })
      return Response.json({ received: false }, { status: 400 })
    }

    // Idempotensjournalen skrives før noen sideeffekt. Feiler den på unikhet,
    // har vi sett hendelsen før.
    try {
      await payload.create({
        collection: 'webhook-events',
        data: {
          eventId: event.id,
          provider: 'stripe',
          type: event.type,
          processedAt: new Date().toISOString(),
        },
        overrideAccess: true,
        req,
      })
    } catch {
      payload.logger.info(`Stripe-hendelse ${event.id} er allerede behandlet.`)
      return Response.json({ received: true, duplicate: true })
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntentID = event.data.object.id
      const transactions = await payload.find({
        collection: 'transactions',
        where: { 'stripe.paymentIntentID': { equals: paymentIntentID } },
        limit: 1,
        overrideAccess: true,
        req,
      })

      const transaction = transactions.docs[0]
      if (!transaction) {
        // Ukjent betaling: svar 200 likevel. Et feilsvar ville gitt evig retry
        // på noe vi uansett ikke kan koble til en ordre.
        payload.logger.warn(`Fant ingen transaksjon for PaymentIntent ${paymentIntentID}.`)
        return Response.json({ received: true })
      }

      const paidAmount = event.data.object.amount_received ?? event.data.object.amount
      if (paidAmount !== transaction.amount) {
        // Beløpsavvik: transaksjonen blir stående som `pending`, ikke satt til
        // `succeeded`. Pluginens statusliste har ingen egen verdi for «krever
        // gjennomgang», og å markere den `failed` ville vært like misvisende —
        // betalingen gikk gjennom, det er vår registrering som ikke stemmer.
        // En ordre uten bekreftelse er synlig og opprydningsbar; en feilaktig
        // bekreftet ordre er det ikke.
        payload.logger.error(
          `Beløpsavvik på ${paymentIntentID}: betalt ${paidAmount}, forventet ${transaction.amount}. ` +
            'Transaksjonen står som pending og må gjennomgås manuelt.',
        )
        return Response.json({ received: true })
      }

      await payload.update({
        collection: 'transactions',
        id: transaction.id,
        data: { status: 'succeeded' },
        overrideAccess: true,
        req,
      })
      payload.logger.info(`Betaling bekreftet for ${paymentIntentID}.`)
    }

    return Response.json({ received: true })
  },
})
