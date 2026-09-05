'use client'

import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { NOK } from '@/ecommerce/config'

/**
 * Kurv-, adresse- og betalingskonteksten fra `plugin-ecommerce`.
 *
 * Kurven ligger i Payload, ikke i lokal state: `useCart` snakker med
 * carts-collection-en over API-et. Derfor overlever den at fanen lukkes, og
 * checkout leser samme kurv som produktsiden skrev til.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EcommerceProvider currenciesConfig={{ defaultCurrency: 'NOK', supportedCurrencies: [NOK] }}>
      {children}
    </EcommerceProvider>
  )
}
