'use client'

import React from 'react'

import { EmptyState } from '@/components/stille/EmptyState'
import { ProductCard } from '@/components/stille/ProductCard'
import { formatOre } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { Product } from '@/payload-types'

import styles from './SavedSection.module.css'

/**
 * «Lagrede» produkter. Ligger på `users.saved` (relasjon til `products`),
 * ikke i `localStorage` — lista skal følge kontoen mellom enheter, ikke
 * nettleseren. Fjerning er en PATCH på egen bruker, samme mønster som
 * `ProfileSection` bruker for passordbytte.
 */
export function SavedSection({
  userId,
  initialProducts,
}: {
  userId: number
  initialProducts: Product[]
}) {
  const [products, setProducts] = React.useState(initialProducts)
  const [error, setError] = React.useState<string | null>(null)

  const remove = async (id: number) => {
    const previous = products
    const next = products.filter((product) => product.id !== id)
    setProducts(next)
    setError(null)

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ saved: next.map((product) => product.id) }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setProducts(previous)
      setError('Kunne ikke fjerne produktet. Prøv igjen.')
    }
  }

  return (
    <section>
      <h2>Lagrede</h2>

      {error ? <p style={{ color: 'var(--st-error)' }}>{error}</p> : null}

      {products.length === 0 ? (
        <EmptyState title="Ingen lagrede objekter.">
          Hjertet på et produktkort legger det til her.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => {
            const image = product.images?.[0]?.image
            const category =
              typeof product.category === 'object' ? product.category?.title : undefined

            return (
              <ProductCard
                key={product.id}
                image={mediaUrl(image)}
                alt={mediaAlt(image)}
                title={product.title}
                category={category ?? ''}
                price={formatOre(product.priceInNOK ?? 0)}
                href={`/produkt/${product.slug}`}
                saveable
                saved
                onSaveChange={(saved) => {
                  if (!saved) void remove(product.id)
                }}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
