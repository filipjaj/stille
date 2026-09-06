'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { CART_STORAGE_KEY } from '@/ecommerce/currency'
import { toVatRate } from '@/money'
import type { Line, Ore, VatRate } from '@/money'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { Media } from '@/payload-types'

/**
 * Delt mellom kurv- og checkout-flatene (og andre steder som senere måtte
 * trenge kurvlinjer med visningsdata). Mappen har understrek-prefiks, så Next
 * ruter ikke på den — se `_shared/product-tile.tsx`.
 *
 * Kurven (hvilke produkter, hvilket antall) kommer alltid fra `useCart()` —
 * det er den eneste sannheten, se Providers.tsx. Prosjektet har derimot ikke
 * deklarert en `ecommerce`-generic i payload-types.ts, så plugin-ens egne
 * typer faller tilbake på en utypet `CartsUntyped` (se
 * plugin-ecommerce/dist/types/utilities.d.ts) — `cart.items` er `any[]` i
 * praksis. `RawCartItem` er formen vi selv stoler på: id-en, uansett om
 * produktet/varianten kom som tall eller (delvis populert) objekt.
 *
 * Tittel, bilde og MVA-sats finnes ikke i det plugin-en henter ut av boksen
 * (standardspørringen populerer bare prisfeltet, for å holde kurv-endepunktet
 * tynt) — de hentes derfor her, direkte fra Payloads REST-API, i stedet for å
 * utvide `cartsFetchQuery` globalt i Providers.tsx og dermed endre hva alle
 * andre kurv-forbrukere i appen får tilbake.
 */
export type RawCartItem = {
  id: string
  quantity: number
  product?: { id: number } | number | null
  variant?: { id: number } | number | null
}

export type CartLineView = {
  /** Kurvlinjens id — brukes til increment/decrement/remove. */
  id: string
  productId: number
  title: string
  image?: string
  imageAlt: string
  /** Variantetiketter (fargenavn e.l.), slått sammen. Utelatt uten variant. */
  variantLabel?: string
  quantity: number
  unitGross: Ore
  vatRate: VatRate
  lineGross: Ore
}

type ProductLookup = {
  id: number
  title: string
  slug: string
  vatRate: string
  priceInNOK: number | null
  images?: { image: number | Media | null }[] | null
}

type VariantLookup = {
  id: number
  priceInNOK: number | null
  options?: { id: number; label: string }[] | null
}

const toId = (value: { id: number } | number | null | undefined): number | undefined => {
  if (value === null || value === undefined) return undefined
  return typeof value === 'object' ? value.id : value
}

async function fetchByIds<T>(collection: string, ids: number[], fields: string[]): Promise<T[]> {
  if (ids.length === 0) return []

  const params = new URLSearchParams()
  ids.forEach((id, index) => params.append(`where[id][in][${index}]`, String(id)))
  // Payloads standard side-størrelse er 10 — uten denne kuttes kurver med
  // flere enn ti ulike produkter stille.
  params.set('limit', String(ids.length))
  params.set('depth', '1')
  fields.forEach((field) => params.set(`select[${field}]`, 'true'))

  const response = await fetch(`/api/${collection}?${params.toString()}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`Klarte ikke å hente ${collection} for kurven.`)
  }
  const data = (await response.json()) as { docs: T[] }
  return data.docs
}

/** Stabil referanse, så en tom kurv ikke gir ny array ved hver render. */
const EMPTY_LINES: CartLineView[] = []

/**
 * Slår opp visningsdata for linjene i kurven. Kurvens egen sammensetning
 * (produkt-id, variant-id, antall) er alltid fasiten — dette legger bare til
 * det kurv-collection-en ikke lagrer en kopi av selv.
 */
export function useCartLines(items: RawCartItem[]): {
  lines: CartLineView[]
  isLoading: boolean
} {
  // Linjene lagres sammen med nøkkelen de hører til. Da kan lastetilstanden
  // utledes — den er sann så lenge det vi har hentet gjelder en annen kurv enn
  // den vi ser på nå — i stedet for å settes synkront i effekten.
  const [fetched, setFetched] = useState<{ key: string; lines: CartLineView[] } | null>(null)
  const isEmpty = items.length === 0

  const productIds = Array.from(
    new Set(items.map((item) => toId(item.product)).filter((id): id is number => id !== undefined)),
  )
  const variantIds = Array.from(
    new Set(items.map((item) => toId(item.variant)).filter((id): id is number => id !== undefined)),
  )
  // Effekten skal kjøre når kurvens *innhold* endres, ikke ved hver render —
  // items/productIds/variantIds er nye array-referanser hver gang. En avledet
  // nøkkel som faktisk endrer verdi når kurven gjør det, løser det uten en
  // dyp sammenligning.
  const key = `${productIds.join(',')}|${variantIds.join(',')}|${items
    .map((item) => `${item.id}:${item.quantity}`)
    .join(',')}`

  useEffect(() => {
    // Tom kurv utledes i stedet for å settes.
    if (isEmpty) return

    let cancelled = false

    void (async () => {
      const [products, variants] = await Promise.all([
        fetchByIds<ProductLookup>('products', productIds, [
          'title',
          'slug',
          'vatRate',
          'priceInNOK',
          'images',
        ]),
        fetchByIds<VariantLookup>('variants', variantIds, ['priceInNOK', 'options']),
      ])
      if (cancelled) return

      const productById = new Map(products.map((product) => [product.id, product]))
      const variantById = new Map(variants.map((variant) => [variant.id, variant]))

      const nextLines: CartLineView[] = []
      for (const item of items) {
        const productId = toId(item.product)
        const product = productId !== undefined ? productById.get(productId) : undefined
        if (!product) continue // produktet finnes ikke lenger — vis ikke linjen

        const variantId = toId(item.variant)
        const variant = variantId !== undefined ? variantById.get(variantId) : undefined

        // `priceInNOKEnabled` er ikke med her bevisst: seed-dataen viser at
        // feltet står `null` på produkter som likevel har en ekte pris, og
        // plugin-ens egen standardspørring henter det aldri for varianter
        // heller — det styrer altså ikke hvilken pris som faktisk gjelder.
        const unitGross =
          typeof variant?.priceInNOK === 'number' ? variant.priceInNOK : (product.priceInNOK ?? 0)

        const variantLabel = variant?.options
          ?.map((option) => option.label)
          .filter(Boolean)
          .join(' / ')

        const firstImage = product.images?.[0]?.image

        nextLines.push({
          id: item.id,
          productId: product.id,
          title: product.title,
          image: mediaUrl(firstImage),
          imageAlt: mediaAlt(firstImage, product.title),
          variantLabel: variantLabel || undefined,
          quantity: item.quantity,
          unitGross,
          vatRate: toVatRate(product.vatRate),
          lineGross: unitGross * item.quantity,
        })
      }

      setFetched({ key, lines: nextLines })
    })()

    return () => {
      cancelled = true
    }
    // key oppsummerer alt effekten bryr seg om — se kommentaren over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isEmpty])

  // Utledet, ikke lagret: en tom kurv har ingen linjer og venter ikke på noe,
  // og vi laster så lenge det vi har hentet gjelder en annen kurv.
  const current = fetched?.key === key ? fetched.lines : undefined
  return {
    lines: isEmpty ? EMPTY_LINES : (current ?? EMPTY_LINES),
    isLoading: isEmpty ? false : current === undefined,
  }
}

/** Kurvlinjer om til `Line[]` for `calculateTotals`. */
export function cartLinesToMoneyLines(lines: CartLineView[]): Line[] {
  return lines.map((line) => ({
    unitGross: line.unitGross,
    quantity: line.quantity,
    vatRate: line.vatRate,
  }))
}

export type ShopShippingRules = {
  shippingCost: Ore
  freeShippingThreshold?: Ore | null
}

/**
 * Fraktprisen for en gitt kurvsum. Reglene (kostnad, fri frakt-grense) kommer
 * fra `shop`-globalen — se src/globals/Shop.ts — ikke fra tall hardkodet her.
 *
 * MVA-satsen på frakt er derimot ikke modellert i globalen i det hele tatt.
 * Standardsatsen (25 %) brukes, i tråd med `money`-modulens egne
 * testfixturer (totals.spec.ts) — frakt er normalt en egen avgiftspliktig
 * tjeneste med standardsats når den ikke er en del av varens pris.
 */
export function resolveShipping(
  itemsGross: Ore,
  shop: ShopShippingRules,
): { gross: Ore; vatRate: VatRate } {
  const free = shop.freeShippingThreshold != null && itemsGross >= shop.freeShippingThreshold
  return { gross: free ? 0 : shop.shippingCost, vatRate: 25 }
}

/**
 * Er kurven ferdig lastet?
 *
 * `useCart()` gir ingen ærlig lastetilstand for en fersk besøkende.
 * `cart` starter som `undefined` og en kurv opprettes først idet noe legges i
 * den, mens `isLoading` står `false` hele veien. «Kurven hentes» og «det
 * finnes ingen kurv» er altså samme tilstand i plugin-ens API — og en flate
 * som venter på at `cart` skal bli definert, venter for alltid.
 *
 * Skillet ligger i localStorage: har vi ingen lagret kurv-id, finnes det
 * ingen kurv, og flaten er tom med en gang. Har vi en, er kurven på vei og
 * flaten skal vente på den.
 *
 * `undefined` betyr «vet ikke ennå» — det er svaret under server-rendring og
 * i hydreringsrenderingen, der localStorage ikke kan leses. Flaten skal vise
 * lastetilstand da, ikke blinke «kurven er tom» for noen som har varer i den.
 */
export function useCartReady(cart: unknown): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('storage', onChange)
    return () => window.removeEventListener('storage', onChange)
  }, [])

  const storedCartId = useSyncExternalStore(
    subscribe,
    (): string | null => {
      try {
        return localStorage.getItem(CART_STORAGE_KEY)
      } catch {
        // Privat modus eller blokkerte cookies: ingen lagret kurv å vente på.
        return null
      }
    },
    (): undefined => undefined,
  )

  if (storedCartId === undefined) return false
  if (storedCartId === null) return true
  return cart !== undefined
}
