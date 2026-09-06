import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import Stripe from 'stripe'

import { confirmOrder } from './confirmOrder'
import { initiatePayment } from './initiatePayment'
import { webhooksEndpoint } from './webhooks'

/**
 * Én API-versjon for hele adapteren.
 *
 * Pluginens egen adapter bruker to ulike versjoner i initiatePayment og
 * webhooks, noe som gjør at de to sidene av samme betaling kan tolke feltene
 * forskjellig. Her er den én konstant.
 *
 * Når Stripe innvilger Vipps-previewen, hektes flagget på her:
 *   `${API_VERSION}; vipps_preview=v1`
 * Spiken bekreftet at det er riktig mekanisme — avslaget var på rettigheter,
 * ikke på syntaks. Vipps dukker da opp av seg selv, siden PaymentIntent-ene
 * opprettes med `automatic_payment_methods`.
 */
export const API_VERSION = '2025-06-30.preview'

export type StripeAdapterConfig = {
  secretKey: string
  webhookSecret?: string
}

/**
 * Lager en Stripe-klient som fungerer på Cloudflare Workers.
 *
 * **`httpClient` må settes eksplisitt.** `stripe@22` har en `workerd`-export
 * som velger fetch-klienten av seg selv, men det forutsetter at bundleren
 * løser den export-betingelsen. Det gjør ikke OpenNext: den bygde worker-en
 * inneholdt Stripes Node-plattform — `NodeHttpClient` og `node:https` — og
 * null spor av web-plattformen.
 *
 * Konsekvensen var ikke en feilmelding. Utgående kall over `node:https` i
 * workerd fullfører aldri, så `/api/payments/stripe/initiate` hang til
 * runtimen ga opp: ingen respons, ingen exception, ingenting i loggen. Samme
 * signatur som synkron signaturverifisering i webhooks.ts, og samme svar —
 * be om web-implementasjonen i stedet for å håpe på riktig oppløsning.
 */
export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    // @ts-expect-error Stripe typer bare siste stabile versjon; preview-strengen
    // er gyldig i API-et og er dokumentert som riktig måte å be om preview-funksjoner.
    apiVersion: API_VERSION,
    appInfo: { name: 'Stille', url: 'https://stille.example' },
    httpClient: Stripe.createFetchHttpClient(),
  })
}

/**
 * Stripe-adapter for `plugin-ecommerce`.
 *
 * Skrevet fra grunnen i stedet for å bruke pluginens egen, av to grunner som
 * begge er verifisert, ikke antatt:
 *
 * 1. Pluginens webhook-endepunkt kaller synkron `constructEvent`, som kaster
 *    på Workers. Den fanger unntaket og svarer 400, så Stripe retry-er i det
 *    uendelige og ingen ordre blir noen gang bekreftet — en stille feil.
 * 2. Pluginens `initiatePayment` bruker `cart.subtotal` som beløp, altså uten
 *    frakt og uten at MVA er kontrollert mot vår egen beregning.
 */
export const stripeAdapter = (config: StripeAdapterConfig): PaymentAdapter => ({
  name: 'stripe',
  label: 'Kort, Vipps og Klarna',
  confirmOrder: confirmOrder(config),
  initiatePayment: initiatePayment(config),
  endpoints: [webhooksEndpoint(config)],
  group: {
    name: 'stripe',
    type: 'group',
    label: 'Stripe',
    admin: {
      condition: (data) => data?.paymentMethod === 'stripe',
    },
    fields: [
      { name: 'customerID', type: 'text', label: 'Stripe-kunde' },
      { name: 'paymentIntentID', type: 'text', label: 'PaymentIntent' },
    ],
  },
})
