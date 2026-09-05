import type { Metadata } from 'next'
import React from 'react'

import { getPayloadClient } from '@/lib/payload'

import { CartView } from './CartView'

export const metadata: Metadata = {
  title: 'Handlekurv',
}

/**
 * Handlekurv. Selve kurvinnholdet leses fra `useCart()` i klientkomponenten
 * — denne serverkomponenten henter bare fraktreglene fra `shop`-globalen, så
 * de aldri hardkodes i butikkflatene.
 */
export default async function KurvPage() {
  const payload = await getPayloadClient()
  const shop = await payload.findGlobal({ slug: 'shop' })

  return (
    <CartView shippingCost={shop.shippingCost} freeShippingThreshold={shop.freeShippingThreshold} />
  )
}
