import type { Metadata } from 'next'
import React from 'react'

import { getPayloadClient } from '@/lib/payload'

import { CheckoutView } from './CheckoutView'

export const metadata: Metadata = {
  title: 'Kassen',
}

/**
 * Checkout. Fraktreglene og de tilgjengelige betalingsmetodene kommer fra
 * `shop`-globalen — hentet her, i serverkomponenten, og sendt ned som props.
 * Selve skjemaet og kurvoppsummeringen er en klientkomponent, siden kurven
 * kommer fra `useCart()`.
 */
export default async function KassePage() {
  const payload = await getPayloadClient()
  const shop = await payload.findGlobal({ slug: 'shop' })

  return (
    <CheckoutView
      shippingCost={shop.shippingCost}
      freeShippingThreshold={shop.freeShippingThreshold}
      paymentMethods={shop.paymentMethods}
    />
  )
}
