import React from 'react'

import { ProductCard } from '@/components/stille/ProductCard'
import { formatOre } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { Product } from '@/payload-types'

/**
 * Delt produktvisning for journal- og lookbook-flatene (og andre steder som
 * viser produkter fra en relasjon, ikke fra kategorisiden).
 *
 * Mappen har understrek-prefiks, så Next ruter ikke på den.
 */

/** Første bilde på produktet — det samme produktkortet ellers viser. */
function firstProductImage(product: Product) {
  return product.images?.[0]?.image
}

function productCategoryLabel(product: Product): string {
  const { category } = product
  return category && typeof category === 'object' ? category.title : ''
}

/** Filtrerer bort udypede relasjoner (tall) som `depth` ikke har løst opp. */
export function toProducts(items: (number | Product)[] | null | undefined): Product[] {
  return (items ?? []).filter((item): item is Product => typeof item === 'object')
}

/**
 * Tynn wrapper rundt `ProductCard` som løser opp bilde, kategori-tittel og
 * pris fra et Payload-produkt. `ProductCard` viser selv designsystemets
 * sandflate når `image` er utelatt, så mangler produktet bilde sendes det
 * ganske enkelt ikke med.
 */
export function ProductTile({ product }: { product: Product }) {
  const image = mediaUrl(firstProductImage(product))
  const alt = mediaAlt(firstProductImage(product))
  const category = productCategoryLabel(product)
  const price = formatOre(product.priceInNOK ?? 0)
  const href = `/produkt/${product.slug}`

  return (
    <ProductCard
      image={image}
      alt={alt}
      title={product.title}
      category={category}
      price={price}
      href={href}
    />
  )
}
