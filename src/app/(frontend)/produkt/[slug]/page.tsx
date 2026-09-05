import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Where } from 'payload'
import React from 'react'

import { ProductCardAdd } from '@/components/butikk/ProductCardAdd'
import { Accordion } from '@/components/stille/Accordion'
import { Breadcrumbs } from '@/components/stille/Breadcrumbs'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { formatOre } from '@/lib/format'
import { categoryLabel, getPayloadClient } from '@/lib/payload'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { Variant } from '@/payload-types'

import { ProductPurchase, type PurchaseVariant } from './ProductPurchase'
import styles from './produkt.module.css'

type Params = { slug: string }

async function findProduct(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return docs[0]
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) return { title: 'Produkt' }

  return {
    title: product.seo?.title || product.title,
    description: product.seo?.description || product.description || undefined,
  }
}

/**
 * Produktdetalj: bilde, pris, variant + antall + legg i kurven, en
 * informasjonsaccordion og "Passer sammen med". `notFound()` når slug-en
 * ikke matcher et publisert produkt.
 */
export default async function ProduktPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) notFound()

  const payload = await getPayloadClient()
  const category =
    product.category && typeof product.category === 'object' ? product.category : undefined

  const relatedWhere: Where = {
    _status: { equals: 'published' },
    id: { not_equals: product.id },
  }
  if (category) relatedWhere.category = { equals: category.id }

  const [related, shop] = await Promise.all([
    payload.find({
      collection: 'products',
      where: relatedWhere,
      sort: '-createdAt',
      limit: 3,
      depth: 2,
    }),
    payload.findGlobal({ slug: 'shop' }),
  ])

  const image = product.images?.[0]?.image
  const imageUrl = mediaUrl(image)

  // Varianter (f.eks. farge) er en egen collection knyttet via join-feltet
  // `variants`. Uten `enableVariants`, eller uten variant-dokumenter ennå,
  // faller kjøpskomponenten tilbake på grunnprisen uten variantvelger.
  const isVariantDoc = (doc: number | Variant): doc is Variant =>
    typeof doc === 'object' && doc._status !== 'draft'

  const variants: PurchaseVariant[] = product.enableVariants
    ? (product.variants?.docs ?? []).filter(isVariantDoc).map((variant) => {
        const label =
          variant.options
            .map((option) => (typeof option === 'object' ? option.label : ''))
            .filter(Boolean)
            .join(' / ') ||
          variant.title ||
          `Variant ${variant.id}`
        return {
          id: variant.id,
          label,
          priceInNOK:
            variant.priceInNOKEnabled && variant.priceInNOK != null
              ? variant.priceInNOK
              : (product.priceInNOK ?? 0),
          soldOut: variant.inventory != null && variant.inventory <= 0,
        }
      })
    : []

  const variantTypeLabel =
    product.variantTypes?.[0] && typeof product.variantTypes[0] === 'object'
      ? product.variantTypes[0].label
      : 'Variant'

  const soldOut = product.inventory != null && product.inventory <= 0

  const deliveryLine = shop.freeShippingThreshold
    ? `Sendes innen to virkedager. Fri frakt over ${formatOre(shop.freeShippingThreshold)}.`
    : 'Sendes innen to virkedager.'

  return (
    <div>
      <div className={styles.crumbs}>
        <Breadcrumbs
          items={[
            { label: 'Samlingen', href: '/samlingen' },
            ...(category
              ? [{ label: category.title, href: `/samlingen?kategori=${category.slug}` }]
              : []),
            { label: product.title },
          ]}
        />
      </div>

      <section className={styles.layout}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={mediaAlt(image, product.title)} className={styles.image} />
        ) : (
          <div className={`st-media ${styles.image}`} role="img" aria-label={product.title} />
        )}

        <div className={styles.info}>
          <Eyebrow as="span" style={{ display: 'block' }}>
            {categoryLabel(product.category)} / {product.sku}
          </Eyebrow>
          <h1 className={styles.title}>{product.title}</h1>
          <p className={styles.price}>{formatOre(product.priceInNOK ?? 0)}</p>
          {product.description ? <p className={styles.description}>{product.description}</p> : null}

          <ProductPurchase
            productId={product.id}
            variantTypeLabel={variantTypeLabel}
            variants={variants}
            soldOut={soldOut}
          />

          <div style={{ paddingTop: 40 }}>
            <Accordion
              items={[
                ...(product.care ? [{ title: 'Materiale og pleie', content: product.care }] : []),
                { title: 'Levering', content: deliveryLine },
                { title: 'Retur', content: '30 dagers åpen retur. Du dekker returporto.' },
              ]}
            />
          </div>
        </div>
      </section>

      {related.docs.length > 0 ? (
        <section className={styles.related}>
          <h2 className={styles.h2}>Passer sammen med</h2>
          <div className={styles.grid3}>
            {related.docs.map((relatedProduct) => {
              const relatedImage = relatedProduct.images?.[0]?.image
              return (
                <ProductCardAdd
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  slug={relatedProduct.slug}
                  title={relatedProduct.title}
                  category={categoryLabel(relatedProduct.category)}
                  priceInNOK={relatedProduct.priceInNOK ?? 0}
                  imageUrl={mediaUrl(relatedImage)}
                  imageAlt={mediaAlt(relatedImage, relatedProduct.title)}
                />
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
