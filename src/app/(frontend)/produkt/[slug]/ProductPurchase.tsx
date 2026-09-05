'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { Button } from '@/components/stille/Button'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { QuantityStepper } from '@/components/stille/QuantityStepper'
import { RadioGroup } from '@/components/stille/RadioGroup'
import { formatOre } from '@/lib/format'

export type PurchaseVariant = {
  id: number
  label: string
  priceInNOK: number
  soldOut: boolean
}

export type ProductPurchaseProps = {
  productId: number
  /** Overskriften over variantvelgeren, f.eks. "Farge" — hentet fra produktets variantType. */
  variantTypeLabel: string
  variants: PurchaseVariant[]
  /** Kun brukt når produktet ikke har varianter. */
  soldOut: boolean
}

/**
 * Variantvalg, antall og "Legg i kurven" for produktsiden. Egen
 * klientkomponent fordi kurven (`useCart`) og valgt variant er lokal state —
 * resten av siden er en serverkomponent.
 */
export function ProductPurchase({
  productId,
  variantTypeLabel,
  variants,
  soldOut,
}: ProductPurchaseProps) {
  const { addItem, isLoading } = useCart()
  const [variantId, setVariantId] = React.useState<number | undefined>(variants[0]?.id)
  const [qty, setQty] = React.useState(1)
  const [added, setAdded] = React.useState(false)

  const hasVariants = variants.length > 0
  const selectedVariant = variants.find((v) => v.id === variantId)
  const outOfStock = hasVariants ? Boolean(selectedVariant?.soldOut) : soldOut

  const handleAdd = async () => {
    await addItem(
      { product: productId, ...(variantId !== undefined ? { variant: variantId } : {}) },
      qty,
    )
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div>
      <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--st-muted)' }}>
        {outOfStock ? 'Utsolgt' : 'På lager'} · levering 3–5 dager
      </p>

      <div style={{ display: 'grid', gap: 24, paddingTop: 32 }}>
        {hasVariants ? (
          <div>
            <Eyebrow as="span" style={{ display: 'block', marginBottom: 12 }}>
              {variantTypeLabel}
            </Eyebrow>
            <RadioGroup
              boxed
              value={variantId !== undefined ? String(variantId) : undefined}
              onValueChange={(v) => setVariantId(Number(v))}
              items={variants.map((v) => ({
                value: String(v.id),
                label: v.label,
                disabled: v.soldOut,
                trail: formatOre(v.priceInNOK),
              }))}
            />
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 16 }}>
          <QuantityStepper value={qty} min={1} onChange={setQty} label="Antall" />
          <div style={{ flex: 1 }}>
            <Button
              fullWidth
              icon="shopping-bag"
              onClick={handleAdd}
              disabled={outOfStock}
              loading={isLoading}
            >
              {outOfStock ? 'Utsolgt' : added ? 'Lagt i kurven' : 'Legg i kurven'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
