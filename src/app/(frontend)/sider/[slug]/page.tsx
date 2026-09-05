import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/components/butikk/blocks/RenderBlocks'
import { mediaUrl } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import type { Page } from '@/payload-types'

type Params = { slug: string }

/**
 * Slår opp en publisert side på slug. `find` brukes fremfor `findByID` siden
 * ruten adresserer via slug, ikke id. Local API omgår tilgangskontroll som
 * standard, så publisert-filteret må settes eksplisitt her — uten det ville
 * anonyme besøkende sett utkast.
 */
async function getPage(slug: string): Promise<Page | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    depth: 1,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}

  const title = page.seo?.title || page.title
  const description = page.seo?.description ?? undefined
  const image = mediaUrl(page.seo?.image)

  return {
    title,
    description,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  }
}

export default async function SidePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  return (
    <article>
      <RenderBlocks blocks={page.layout} />
    </article>
  )
}
