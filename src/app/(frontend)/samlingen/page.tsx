import type { Metadata } from 'next'
import Link from 'next/link'
import type { Where } from 'payload'
import React from 'react'

import { ProductCardAdd } from '@/components/butikk/ProductCardAdd'
import { EmptyState } from '@/components/stille/EmptyState'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { categoryLabel, getPayloadClient } from '@/lib/payload'
import { mediaAlt, mediaUrl } from '@/lib/media'

import { SortSelect } from './SortSelect'
import styles from './samlingen.module.css'

type SearchParams = { kategori?: string; sortering?: string }

const SORT_FIELD: Record<string, string> = {
  new: '-createdAt',
  low: 'priceInNOK',
  high: '-priceInNOK',
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const { kategori } = await searchParams
  if (!kategori) return { title: 'Samlingen' }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: kategori } },
    limit: 1,
  })

  return { title: docs[0] ? `Samlingen — ${docs[0].title}` : 'Samlingen' }
}

/**
 * Samlingen: alle publiserte objekter, med kategori-faner og sortering i
 * URL-en (`?kategori=<slug>&sortering=<new|low|high>`), slik at filteret kan
 * lenkes til og overlever en reload.
 */
export default async function SamlingenPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { kategori, sortering = 'new' } = await searchParams
  const payload = await getPayloadClient()

  const categories = await payload.find({
    collection: 'categories',
    sort: 'title',
    limit: 100,
  })
  const activeCategory = categories.docs.find((c) => c.slug === kategori)

  const where: Where = { _status: { equals: 'published' } }
  if (activeCategory) {
    where.category = { equals: activeCategory.id }
  }

  const products = await payload.find({
    collection: 'products',
    where,
    sort: SORT_FIELD[sortering] ?? SORT_FIELD.new,
    limit: 60,
    depth: 2,
  })

  const tabHref = (slug?: string) => {
    const params = new URLSearchParams()
    if (slug) params.set('kategori', slug)
    if (sortering !== 'new') params.set('sortering', sortering)
    const query = params.toString()
    return query ? `/samlingen?${query}` : '/samlingen'
  }

  return (
    <div>
      <section className={styles.hero}>
        <Eyebrow as="span" style={{ display: 'block' }}>
          Samlingen / {activeCategory?.title ?? 'Alle'}
        </Eyebrow>
        <h1 className={styles.title}>
          Ting å
          <br />
          <em className={styles.italic}>leve med.</em>
        </h1>
      </section>

      <div className={styles.bar}>
        <div className={styles.tabs}>
          <Link href={tabHref()} className={!activeCategory ? styles.tabActive : styles.tab}>
            Alle
          </Link>
          {categories.docs.map((category) => (
            <Link
              key={category.id}
              href={tabHref(category.slug)}
              className={activeCategory?.id === category.id ? styles.tabActive : styles.tab}
            >
              {category.title}
            </Link>
          ))}
        </div>
        <div className={styles.right}>
          <span className={styles.count}>{products.totalDocs} objekter</span>
          <SortSelect value={sortering} />
        </div>
      </div>

      {products.docs.length > 0 ? (
        <div className={styles.grid}>
          {products.docs.map((product) => {
            const image = product.images?.[0]?.image
            return (
              <ProductCardAdd
                key={product.id}
                id={product.id}
                slug={product.slug}
                title={product.title}
                category={categoryLabel(product.category)}
                priceInNOK={product.priceInNOK ?? 0}
                imageUrl={mediaUrl(image)}
                imageAlt={mediaAlt(image, product.title)}
              />
            )
          })}
        </div>
      ) : (
        <EmptyState title="Ingen objekter her ennå.">
          Prøv en annen kategori, eller <Link href="/samlingen">se hele samlingen</Link>.
        </EmptyState>
      )}
    </div>
  )
}
