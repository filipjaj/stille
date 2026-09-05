import { EmptyState } from '@/components/stille/EmptyState'
import { getPayloadClient } from '@/lib/payload'
import type { Product, ProductsBlock as ProductsBlockType } from '@/payload-types'

import { ProductGridCard } from './ProductGridCard'
import styles from './Products.module.css'

/**
 * Henter produktene blokken skal vise, avhengig av `source`.
 *
 * `manual` beholder redaktørens rekkefølge — `where: { id: { in } }` gir ingen
 * garanti om rekkefølge, så resultatet sorteres manuelt etter den valgte
 * id-listen.
 */
async function resolveProducts(block: ProductsBlockType): Promise<Product[]> {
  const payload = await getPayloadClient()
  const limit = block.limit ?? 8

  if (block.source === 'manual') {
    const ids = (block.products ?? []).map((p) => (typeof p === 'number' ? p : p.id))
    if (ids.length === 0) return []

    const result = await payload.find({
      collection: 'products',
      where: { id: { in: ids }, _status: { equals: 'published' } },
      depth: 1,
      limit: ids.length,
    })
    return ids
      .map((id) => result.docs.find((doc) => doc.id === id))
      .filter((doc): doc is Product => Boolean(doc))
      .slice(0, limit)
  }

  if (block.source === 'category') {
    const categoryId = typeof block.category === 'object' ? block.category?.id : block.category
    if (!categoryId) return []

    const result = await payload.find({
      collection: 'products',
      where: { category: { equals: categoryId }, _status: { equals: 'published' } },
      depth: 1,
      limit,
    })
    return result.docs
  }

  // source === 'collection' — feltnavnet er «collection», men peker på en lookbook.
  const lookbookId = typeof block.collection === 'object' ? block.collection?.id : block.collection
  if (!lookbookId) return []

  const result = await payload.find({
    collection: 'products',
    where: { lookbook: { equals: lookbookId }, _status: { equals: 'published' } },
    depth: 1,
    limit,
  })
  return result.docs
}

export async function ProductsBlockComponent({ block }: { block: ProductsBlockType }) {
  const products = await resolveProducts(block)

  return (
    <section className={styles.section}>
      {block.title ? (
        <div className={styles.header}>
          <h2>{block.title}</h2>
        </div>
      ) : null}

      {products.length === 0 ? (
        <EmptyState title="Ingen produkter ennå.">
          Denne seksjonen viser produkter så snart de er lagt til.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductGridCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
