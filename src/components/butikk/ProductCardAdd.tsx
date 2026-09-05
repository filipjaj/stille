'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { ProductCard } from '@/components/stille/ProductCard'
import { formatOre } from '@/lib/format'

import { useSaved } from './useSaved'

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
 * `ProductCard` med kurv og lagring ferdig kablet.
 *
 * "Legg i kurven" kaller `addItem` fra `useCart`. Hjertet skriver til
 * `users.saved` og vises bare når noen er innlogget — et hjerte som stille
 * ikke lagrer noe er verre enn ingen knapp.
 *
 * Brukes på forsiden, i samlingen og på produktsiden. Bare denne biten av
 * kortet trenger å være klient.
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
  const { canSave, isSaved, toggle } = useSaved()
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
      saveable={canSave}
      saved={isSaved(id)}
      onSaveChange={() => void toggle(id)}
    />
  )
}
