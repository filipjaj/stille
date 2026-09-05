import { getPayload } from 'payload'
import type { Payload } from 'payload'

import type { Category } from '@/payload-types'
import config from '@/payload.config'

/**
 * Payload-instansen for serverkomponenter.
 *
 * Butikkflatene leser alt herfra — det finnes ingen lokal datakilde. `getPayload`
 * cacher instansen selv, så dette er trygt å kalle fra hver rute.
 */
export async function getPayloadClient(): Promise<Payload> {
  return getPayload({ config: await config })
}

/**
 * Løser en lenke fra header/footer til en href.
 *
 * `url` brukes både til eksterne adresser og interne stier som «/samlingen» —
 * feltet er en rå href. `page` peker på en CMS-side og løses til /sider/<slug>.
 */
export function linkHref(link: {
  type: 'internal' | 'external'
  page?: unknown
  url?: string | null
}): string {
  if (link.type === 'external') return link.url ?? '#'
  const page = link.page
  if (page && typeof page === 'object' && 'slug' in page) {
    return `/sider/${String((page as { slug: string }).slug)}`
  }
  return '#'
}

/**
 * Tittelen på et produkts kategori, eller tom streng når relasjonen ikke er
 * dypet opp.
 *
 * Ligger her og ikke i en komponentfil: den kalles fra serverkomponenter, og
 * en ren hjelpefunksjon eksportert fra en `'use client'`-modul kan ikke kalles
 * på serveren — Next kaster «Attempted to call ... from the server».
 */
export function categoryLabel(category: Category | null | number | undefined): string {
  return category && typeof category === 'object' ? category.title : ''
}
