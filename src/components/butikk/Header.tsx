import Link from 'next/link'
import React from 'react'

import { getPayloadClient, linkHref } from '@/lib/payload'

import { CartLink } from './CartLink'

/**
 * Toppmenyen. Navigasjonen kommer fra `header`-globalen i Payload, ikke fra
 * en hardkodet liste — redaktøren styrer den fra adminen.
 */
export async function Header() {
  const payload = await getPayloadClient()
  const header = await payload.findGlobal({ slug: 'header', depth: 1 })
  const nav = header.nav ?? []

  return (
    <header className="st-shop-header">
      <Link href="/" className="st-wordmark">
        stille
      </Link>

      <nav className="st-shop-nav" aria-label="Hovedmeny">
        {nav.map((item) => (
          <Link key={item.id ?? item.label} href={linkHref(item)} className="st-nav-link">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="st-shop-nav">
        <Link href="/sok" className="st-nav-link">
          Søk
        </Link>
        <Link href="/konto" className="st-nav-link">
          Konto
        </Link>
        <CartLink />
      </div>
    </header>
  )
}
