'use client'

import React from 'react'

import { EmptyState } from '@/components/stille/EmptyState'
import { ProductCard } from '@/components/stille/ProductCard'
import { Skeleton } from '@/components/stille/Skeleton'
import { formatOre } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { Product } from '@/payload-types'

import styles from './SavedSection.module.css'

const STORAGE_KEY = 'stille-lagrede'

function readSavedIds(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : []
  } catch {
    return []
  }
}

function writeSavedIds(ids: number[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Ingen lagring tilgjengelig (privat modus e.l.) — ignoreres stille.
  }
}

/**
 * «Lagrede» produkter. Datamodellen har ingen wishlist-collection i
 * Payload — id-ene lagres derfor i `localStorage` på klienten (samme
 * hjerte-avkrysning som `ProductCard` allerede støtter), mens selve
 * produktdataene alltid hentes ferskt fra Payload. Se rapport.
 */
export function SavedSection() {
  const [ids, setIds] = React.useState<number[] | null>(null)
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setIds(readSavedIds())
  }, [])

  React.useEffect(() => {
    if (ids === null) return

    if (ids.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/products?where[id][in]=${ids.join(',')}&depth=1&limit=${ids.length}`)
      .then((res) => res.json())
      .then((data: { docs?: Product[] }) => {
        if (!cancelled) setProducts(data.docs ?? [])
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [ids])

  const remove = (id: number) => {
    const next = (ids ?? []).filter((existing) => existing !== id)
    setIds(next)
    writeSavedIds(next)
  }

  return (
    <section>
      <h2>Lagrede</h2>

      {loading ? (
        <Skeleton lines={3} height={200} />
      ) : products.length === 0 ? (
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
                  if (!saved) remove(product.id)
                }}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
