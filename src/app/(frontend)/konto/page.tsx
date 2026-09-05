import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { Sidebar, type SidebarItem } from '@/components/stille/Sidebar'
import { getPayloadClient } from '@/lib/payload'
import type { Order } from '@/payload-types'

import { AddressesSection } from './AddressesSection'
import styles from './konto.module.css'
import { OrdersSection } from './OrdersSection'
import { ProfileSection } from './ProfileSection'
import { SavedSection } from './SavedSection'

export const metadata: Metadata = {
  title: 'Konto',
  description: 'Ordre, adresser og profil.',
}

type Section = 'adresser' | 'lagrede' | 'ordre' | 'profil'

const SECTIONS: Section[] = ['ordre', 'adresser', 'profil', 'lagrede']

const SECTION_LABEL: Record<Section, string> = {
  ordre: 'Ordre',
  adresser: 'Adresser',
  profil: 'Profil',
  lagrede: 'Lagrede',
}

type SearchParams = { ordre?: string; seksjon?: string }

/**
 * Kontosiden. Ekte Payload-auth: `payload.auth` leser sesjonscookien via
 * `headers()`. Ingen innlogget bruker → redirect til innloggingssiden i
 * stedet for å simulere en bruker.
 */
export default async function KontoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    redirect('/konto/logg-inn')
  }

  const { ordre, seksjon } = await searchParams
  const section: Section = SECTIONS.includes(seksjon as Section) ? (seksjon as Section) : 'ordre'

  const sidebarItems: SidebarItem[] = SECTIONS.map((key) => ({
    label: SECTION_LABEL[key],
    href: `/konto?seksjon=${key}`,
    active: key === section,
  }))

  let content: ReactNode = null

  if (section === 'ordre') {
    const result = await payload.find({
      collection: 'orders',
      where: { customer: { equals: user.id } },
      sort: '-createdAt',
      depth: 1,
      limit: 50,
    })

    let selected: Order | null = null
    if (ordre) {
      selected = result.docs.find((order) => String(order.id) === ordre) ?? null
    }

    content = <OrdersSection orders={result.docs} selected={selected} />
  } else if (section === 'adresser') {
    content = <AddressesSection />
  } else if (section === 'profil') {
    content = <ProfileSection user={user} />
  } else {
    content = <SavedSection />
  }

  return (
    <div className={styles.page}>
      <Sidebar items={sidebarItems} product="Konto" brandHref="/" />
      <div>{content}</div>
    </div>
  )
}
