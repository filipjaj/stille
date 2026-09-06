import type { PaymentAdapterClient } from '@payloadcms/plugin-ecommerce/types'

/**
 * Betalingsmetodene klienten kjenner til.
 *
 * `usePayments()` slår opp metoden på navn før den kaller endepunktet:
 * finnes den ikke i denne lista, kaster den «Payment method with ID "stripe"
 * not found» — uten å ha spurt serveren. Serveradapteren kan altså være
 * riktig satt opp, nøklene på plass og endepunktet svare, og kassen feiler
 * likevel, fordi de to sidene aldri møttes.
 *
 * Navnet må være identisk med `name` på serveradapteren i `src/payments/stripe`.
 *
 * Dette er en egen, klientsikker fil av samme grunn som `currency.ts`:
 * plugin-ens egen `stripeAdapterClient` ligger i samme modul som
 * serveradapteren, så å importere den ville dratt Payloads serverkode inn i
 * klientbundelen og feilet på `fs`. Beskrivelsen er fire felter — billigere å
 * eie selv enn å rydde opp i etterpå.
 */
export const stripeClient: PaymentAdapterClient = {
  name: 'stripe',
  label: 'Kort, Vipps og Klarna',
  confirmOrder: true,
  initiatePayment: true,
}

export const paymentMethods: PaymentAdapterClient[] = [stripeClient]
