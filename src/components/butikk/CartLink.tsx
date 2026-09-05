'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import React from 'react'

/**
 * Kurvlenken i toppmenyen, med antall varer.
 *
 * Egen klientkomponent slik at resten av headeren kan være en
 * serverkomponent — bare tellingen trenger kurvkonteksten.
 */
export function CartLink() {
  const { cart } = useCart()
  const count = (cart?.items ?? []).reduce(
    (sum: number, item: { quantity?: number | null }) => sum + (item.quantity ?? 0),
    0,
  )

  return (
    <Link href="/kurv" className="st-nav-link">
      Kurv ({count})
    </Link>
  )
}
