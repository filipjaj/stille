import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { Breadcrumbs } from '@/components/stille/Breadcrumbs'
import { Button } from '@/components/stille/Button'
import { EmptyState } from '@/components/stille/EmptyState'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import type { Lookbook } from '@/payload-types'

import { ProductTile, toProducts } from '../../_shared/product-tile'
import styles from './samling.module.css'

type LookbookPageProps = {
  params: Promise<{ slug: string }>
}

type Look = NonNullable<Lookbook['looks']>[number]

async function getLookbook(slug: string): Promise<Lookbook | undefined> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'lookbooks',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  return docs[0]
}

export async function generateMetadata({ params }: LookbookPageProps): Promise<Metadata> {
  const { slug } = await params
  const lookbook = await getLookbook(slug)
  if (!lookbook) return {}

  return { title: lookbook.title }
}

/**
 * Lookbook — bildeserie med produktkort under hvert bilde. Bildene veksler
 * side (bilde/produkter, produkter/bilde) slik `Butikk desktop.dc.html`,
 * data-screen-label="Samling", gjør mellom looks.
 */
export default async function LookbookPage({ params }: LookbookPageProps) {
  const { slug } = await params
  const lookbook = await getLookbook(slug)
  if (!lookbook) notFound()

  const looks = lookbook.looks ?? []

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[{ label: 'Forside', href: '/' }, { label: 'Samlinger' }, { label: lookbook.title }]}
      />

      <section className={styles.hero}>
        <Eyebrow>Samling{lookbook.season ? ` / ${lookbook.season}` : ''}</Eyebrow>
        <h1 className={styles.title}>{lookbook.title}</h1>
        {lookbook.intro ? <p className={styles.lede}>{lookbook.intro}</p> : null}
      </section>

      {looks.length === 0 ? (
        <EmptyState title="Ingen looks ennå" className={styles.empty}>
          Denne samlingen har ikke fått bilder eller produkter ennå.
        </EmptyState>
      ) : (
        <div className={styles.looks}>
          {looks.map((look, index) => (
            <React.Fragment key={look.id ?? index}>
              <LookSection look={look} index={index} />
              {/*
                Lerretet har et dekorativt sitat mellom første og andre look.
                Vi har ikke noe eget sitatfelt på lookbooks — introen er den
                eneste redaksjonelle teksten som finnes, så den gjenbrukes
                som riss her i stedet for å dikte opp et nytt sitat.
              */}
              {index === 0 && looks.length > 1 && lookbook.intro ? (
                <blockquote className={styles.quote}>{lookbook.intro}</blockquote>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      )}

      {looks.length > 0 ? (
        <div className={styles.cta}>
          <Button href="/samlingen" variant="secondary" icon="arrow-right">
            Hele samlingen
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function LookSection({ look, index }: { look: Look; index: number }) {
  const image = mediaUrl(look.image)
  const alt = mediaAlt(look.image)
  const products = toProducts(look.products)
  const reversed = index % 2 === 1

  return (
    <section className={reversed ? `${styles.look} ${styles.reversed}` : styles.look}>
      <figure className={styles.figure}>
        {image ? (
          <img src={image} alt={alt} className={styles.image} />
        ) : (
          <div className="st-media" style={{ aspectRatio: '29/39' }} />
        )}
        {look.caption ? (
          <figcaption className={styles.caption}>
            {String(index + 1).padStart(2, '0')} — {look.caption}
          </figcaption>
        ) : null}
      </figure>

      {products.length > 0 ? (
        <div className={styles.products}>
          {products.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
