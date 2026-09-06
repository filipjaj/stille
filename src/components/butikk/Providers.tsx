'use client'

import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { CART_STORAGE_KEY, NOK } from '@/ecommerce/currency'
import { paymentMethods } from '@/ecommerce/payment-methods'

/**
 * Kurv-, adresse- og betalingskonteksten fra `plugin-ecommerce`.
 *
 * Kurven ligger i Payload, ikke i lokal state: `useCart` snakker med
 * carts-collection-en over API-et. Derfor overlever den at fanen lukkes, og
 * checkout leser samme kurv som produktsiden skrev til.
 *
 * `paymentMethods` må sendes med. Uten den er lista tom i klienten, og
 * `usePayments().initiatePayment('stripe')` kaster «Payment method with ID
 * "stripe" not found» før den rekker å kontakte serveren — uansett hvor
 * riktig serveradapteren er satt opp.
 *
 * `syncLocalStorage` settes eksplisitt selv om verdien er den samme som
 * plugin-ens standard. Nøkkelen er ikke lenger en detalj vi må gjette på:
 * `useCartReady` leser den for å skille «kurven lastes» fra «det finnes ingen
 * kurv», og de to må være enige om hva den heter.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EcommerceProvider
      currenciesConfig={{ defaultCurrency: 'NOK', supportedCurrencies: [NOK] }}
      syncLocalStorage={{ key: CART_STORAGE_KEY }}
      paymentMethods={paymentMethods}
    >
      {children}
    </EcommerceProvider>
  )
}
