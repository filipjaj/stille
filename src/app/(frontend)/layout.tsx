import React from 'react'

import '@/styles/stille/tokens.css'
import '@/styles/stille/components.css'
import '@/styles/stille/navigation.css'
import '@/styles/stille/admin.css'
import '@/styles/stille/shop.css'

import { Footer } from '@/components/butikk/Footer'
import { Header } from '@/components/butikk/Header'
import { Providers } from '@/components/butikk/Providers'

export const metadata = {
  title: {
    default: 'stille',
    template: '%s — stille',
  },
  description: 'Objekter og fortellinger med plass til hverdagen.',
}

/**
 * Rot for alle butikkflatene. `.st` slår på designsystemets grunnflate,
 * typografi og fokusring.
 *
 * Malens egen styles.css er fjernet: den satte svart bakgrunn og system-font
 * for velkomstsiden som ikke finnes lenger, og kranglet med designsystemet om
 * spesifisitet. Resetten den bidro med ligger nå i tokens.css.
 *
 * Header og Footer er serverkomponenter som leser sine globals fra Payload.
 * Providers gir kurvkonteksten til klientkomponentene under.
 */
export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body className="st">
        <Providers>
          <div className="st-shop">
            <Header />
            <main className="st-shop-main">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
