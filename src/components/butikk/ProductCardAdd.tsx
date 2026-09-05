'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { ProductCard } from '@/components/stille/ProductCard'
import { formatOre } from '@/lib/format'
import type { Category } from '@/payload-types'

export type ProductCardAddProps = {
  id: number
  slug: string
  title: string
  /** Kategorinavn, tomt hvis produktet mangler kategori. */
  category: string
  priceInNOK: number
  imageUrl?: string
  imageAlt: string
}

/**
 * `ProductCard` med kurv-koblingen ferdig kablet: "Legg i kurven" kaller
 * `addItem` fra `useCart` og viser en kort bekreftelse i stedet for
 * standardteksten. Brukes på forsiden, i samlingen og på produktsiden — alle
 * tre trenger nøyaktig denne kombinasjonen, og bare denne biten av kortet
 * trenger å være klient.
 */
export function ProductCardAdd({
  id,
  slug,
  title,
  category,
  priceInNOK,
  imageUrl,
  imageAlt,
}: ProductCardAddProps) {
  const { addItem, isLoading } = useCart()
  const [added, setAdded] = React.useState(false)

  const handleAdd = async () => {
    await addItem({ product: id })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <ProductCard
      image={imageUrl}
      alt={imageAlt}
      title={title}
      category={category}
      price={formatOre(priceInNOK)}
      href={`/produkt/${slug}`}
      showAdd
      onAdd={handleAdd}
      addLabel={isLoading ? 'Legger i kurven …' : added ? 'Lagt i kurven' : 'Legg i kurven'}
    />
  )
}
