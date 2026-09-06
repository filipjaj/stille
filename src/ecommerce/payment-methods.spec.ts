import { describe, expect, it } from 'vitest'

import { stripeAdapter } from '@/payments/stripe'

import { paymentMethods, stripeClient } from './payment-methods'

/**
 * Klient og server må være enige om navnet på betalingsmetoden.
 *
 * `usePayments().initiatePayment(navn)` slår opp metoden i klientlista før den
 * kontakter serveren. Stemmer ikke navnet — eller mangler metoden helt — kaster
 * den «Payment method with ID "stripe" not found», og feilen ser ut som et
 * problem med Stripe-oppsettet. Det er den ikke: serveren blir aldri spurt.
 *
 * Den feilen sto i produksjon med korrekte nøkler, riktig webhook og et
 * fungerende endepunkt. Ingenting annet enn de to navnene var galt.
 */

const server = stripeAdapter({
  // Verdiene betyr ingenting her; testen leser bare navn og etikett.
  secretKey: 'sk_test_ikke_i_bruk',
  webhookSecret: 'whsec_ikke_i_bruk',
})

describe('betalingsmetoder', () => {
  it('klient og server bruker samme navn', () => {
    expect(stripeClient.name).toBe(server.name)
  })

  it('klient og server bruker samme etikett', () => {
    // Etiketten er det kunden leser i kassen. Divergerer den, viser kassen
    // noe annet enn adminen.
    expect(stripeClient.label).toBe(server.label)
  })

  it('metoden er faktisk med i lista providern får', () => {
    // Det holder ikke at beskrivelsen finnes — den må være eksportert i lista
    // som sendes til EcommerceProvider. Var den ikke det, var lista tom.
    expect(paymentMethods.map((m) => m.name)).toContain('stripe')
  })

  it('serveren har handlerne klienten sier finnes', () => {
    expect(stripeClient.initiatePayment).toBe(true)
    expect(stripeClient.confirmOrder).toBe(true)
    expect(typeof server.initiatePayment).toBe('function')
    expect(typeof server.confirmOrder).toBe('function')
  })
})
