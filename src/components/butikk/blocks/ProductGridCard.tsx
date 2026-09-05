'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { ProductCard } from '@/components/stille/ProductCard'
import { Status } from '@/components/stille/Status'
import { formatOre } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { Product } from '@/payload-types'

/**
 * Produktkort med reell «legg i kurven»-handling mot `plugin-ecommerce`s
 * kurv-kontekst. Egen klientkomponent fordi `useCart` krever
 * `EcommerceProvider`, mens blokken som henter produktene er en
 * serverkomponent.
 */
export function ProductGridCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = React.useState(false)

  const image = product.images?.[0]?.image
  const category = typeof product.category === 'object' ? product.category?.title : undefined

  const handleAdd = async () => {
    await addItem({ product: product.id })
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <div>
      <ProductCard
        image={mediaUrl(image)}
        alt={mediaAlt(image)}
        title={product.title}
        category={category ?? ''}
        price={formatOre(product.priceInNOK ?? 0)}
        href={`/produkt/${product.slug}`}
        showAdd
        onAdd={handleAdd}
      />
      {justAdded ? <Status fixed>{product.title} er lagt i kurven.</Status> : null}
    </div>
  )
}
