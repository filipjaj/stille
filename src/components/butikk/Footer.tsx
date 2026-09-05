import Link from 'next/link'
import React from 'react'

import { getPayloadClient, linkHref } from '@/lib/payload'

/**
 * Bunnlinja. Lenker og tekst kommer fra `footer`-globalen i Payload.
 */
export async function Footer() {
  const payload = await getPayloadClient()
  const footer = await payload.findGlobal({ slug: 'footer', depth: 1 })
  const links = footer.links ?? []

  return (
    <footer className="st-shop-footer">
      <span className="st-wordmark st-wordmark-small">stille</span>

      {footer.text ? <p className="st-shop-footer-text">{footer.text}</p> : null}

      <nav className="st-shop-nav" aria-label="Bunnmeny">
        {links.map((link) => (
          <Link key={link.id ?? link.label} href={linkHref(link)} className="st-nav-link">
            {link.label}
          </Link>
        ))}
      </nav>

      <span className="st-shop-footer-note">Demo-butikk. Alle produkter og bilder er fiktive.</span>
    </footer>
  )
}
