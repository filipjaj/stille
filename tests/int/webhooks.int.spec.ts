import { createHmac } from 'crypto'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { webhooksEndpoint } from '@/payments/stripe/webhooks'

/**
 * Integrasjonstester for Stripe-webhooken, mot ekte lokal D1.
 *
 * Signaturen lages her i testen med samme HMAC som Stripe bruker, så ingenting
 * her snakker med Stripe. Det som testes er vår egen håndtering: verifisering,
 * idempotens og beløpskontroll.
 *
 * Idempotensen er den viktigste påstanden i hele betalingsløsningen. D1 har
 * ingen transaksjoner, så ordre og transaksjon kan ikke skrives atomisk — i
 * stedet hviler alt på at den sammensatte unike indeksen på
 * (provider, eventId) hindrer at samme hendelse behandles to ganger. Den
 * påstanden er verdiløs uten en test som faktisk sender hendelsen to ganger.
 */

const WEBHOOK_SECRET = 'whsec_test_hemmelighet'
const SECRET_KEY = 'sk_test_ikke_en_ekte_nokkel'

let payload: Payload
const handler = webhooksEndpoint({
  secretKey: SECRET_KEY,
  webhookSecret: WEBHOOK_SECRET,
}).handler

/** Bygger en Stripe-Signature-header slik Stripe gjør det. */
function sign(body: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const mac = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  return `t=${timestamp},v1=${mac}`
}

/** Minimal PayloadRequest — handleren bruker bare payload, headers og text(). */
function request(body: string, signature: string | null) {
  const headers = new Headers()
  if (signature) headers.set('stripe-signature', signature)
  return {
    payload,
    headers,
    text: async () => body,

    // trenger bare de tre feltene over; å bygge en full PayloadRequest ville
    // testet Payloads eget rammeverk, ikke vår kode.
  } as any
}

/** En payment_intent.succeeded-hendelse med gitt id og beløp. */
function succeededEvent(eventId: string, paymentIntentID: string, amount: number) {
  return JSON.stringify({
    id: eventId,
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: paymentIntentID,
        object: 'payment_intent',
        amount,
        amount_received: amount,
        currency: 'nok',
      },
    },
  })
}

/** Oppretter en transaksjon som venter på betaling. */
async function pendingTransaction(paymentIntentID: string, amount: number) {
  return payload.create({
    collection: 'transactions',
    data: {
      amount,
      currency: 'NOK',
      status: 'pending',
      paymentMethod: 'stripe',
      stripe: { paymentIntentID, customerID: 'cus_test' },
    },
  })
}

const statusOf = async (id: number | string) =>
  (await payload.findByID({ collection: 'transactions', id })).status

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

describe('Stripe-webhook', () => {
  it('avviser en forespørsel uten signatur uten å skrive noe', async () => {
    const before = await payload.count({ collection: 'webhook-events' })

    const res = await handler(request('{}', null))

    expect(res.status).toBe(400)
    const after = await payload.count({ collection: 'webhook-events' })
    expect(after.totalDocs).toBe(before.totalDocs)
  })

  it('avviser en forfalsket signatur uten å skrive noe', async () => {
    const body = succeededEvent('evt_forfalsket', 'pi_forfalsket', 1000)
    const before = await payload.count({ collection: 'webhook-events' })

    const res = await handler(request(body, sign(body, 'feil-hemmelighet')))

    expect(res.status).toBe(400)
    const after = await payload.count({ collection: 'webhook-events' })
    expect(after.totalDocs).toBe(before.totalDocs)
  })

  it('bekrefter betalingen når beløpet stemmer', async () => {
    const paymentIntentID = `pi_${Date.now()}_ok`
    const transaction = await pendingTransaction(paymentIntentID, 151900)
    const body = succeededEvent(`evt_${Date.now()}_ok`, paymentIntentID, 151900)

    const res = await handler(request(body, sign(body, WEBHOOK_SECRET)))

    expect(res.status).toBe(200)
    expect(await statusOf(transaction.id)).toBe('succeeded')
  })

  it('behandler den samme hendelsen bare én gang', async () => {
    const paymentIntentID = `pi_${Date.now()}_dup`
    const eventId = `evt_${Date.now()}_dup`
    const transaction = await pendingTransaction(paymentIntentID, 64000)
    const body = succeededEvent(eventId, paymentIntentID, 64000)
    const signature = sign(body, WEBHOOK_SECRET)

    const first = await handler(request(body, signature))
    expect(first.status).toBe(200)
    expect(await statusOf(transaction.id)).toBe('succeeded')

    // Sett tilbake til pending. Blir hendelsen behandlet på nytt, settes den
    // til succeeded igjen — og da er idempotensen brutt.
    await payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: { status: 'pending' },
    })

    const second = await handler(request(body, signature))
    const secondBody = (await second.json()) as { duplicate?: boolean }

    expect(second.status).toBe(200)
    expect(secondBody.duplicate).toBe(true)
    expect(await statusOf(transaction.id)).toBe('pending')

    const journal = await payload.find({
      collection: 'webhook-events',
      where: { eventId: { equals: eventId } },
    })
    expect(journal.totalDocs).toBe(1)
  })

  it('bekrefter ikke en betaling der beløpet avviker', async () => {
    const paymentIntentID = `pi_${Date.now()}_avvik`
    const transaction = await pendingTransaction(paymentIntentID, 151900)
    // Stripe melder om et annet beløp enn det vi regnet ut.
    const body = succeededEvent(`evt_${Date.now()}_avvik`, paymentIntentID, 100)

    const res = await handler(request(body, sign(body, WEBHOOK_SECRET)))

    expect(res.status).toBe(200)
    expect(await statusOf(transaction.id)).toBe('pending')
  })

  it('svarer 200 på en hendelse uten kjent transaksjon, så Stripe slutter å prøve', async () => {
    const body = succeededEvent(`evt_${Date.now()}_ukjent`, 'pi_finnes_ikke', 1000)

    const res = await handler(request(body, sign(body, WEBHOOK_SECRET)))

    expect(res.status).toBe(200)
  })
})
