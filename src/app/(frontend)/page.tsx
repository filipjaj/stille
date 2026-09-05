import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { ProductCardAdd } from '@/components/butikk/ProductCardAdd'
import { Button } from '@/components/stille/Button'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { categoryLabel, getPayloadClient } from '@/lib/payload'
import { mediaAlt, mediaUrl } from '@/lib/media'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Forside',
}

const ARTICLE_CATEGORY_LABEL: Record<'rom' | 'materialer' | 'mennesker', string> = {
  rom: 'Rom',
  materialer: 'Materialer',
  mennesker: 'Mennesker',
}

/**
 * Forsiden: hero, en samlingsteaser (siste lookbook), tre utvalgte objekter
 * og en journalteaser (siste fremhevede artikkel). Overskrifter og
 * ingress-tekster på selve heroen er fast merkevaretekst — det finnes ingen
 * CMS-felt for dem blant collectionsene ruta har tilgang til — men alt som
 * er innhold (objekter, samling, fortelling) hentes fra Payload.
 */
export default async function ForsidePage() {
  const payload = await getPayloadClient()

  const [featured, lookbooks, featuredArticles] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { _status: { equals: 'published' } },
      sort: '-createdAt',
      limit: 3,
      depth: 2,
    }),
    payload.find({
      collection: 'lookbooks',
      sort: '-createdAt',
      limit: 1,
      depth: 1,
    }),
    payload.find({
      collection: 'articles',
      where: { _status: { equals: 'published' }, featured: { equals: true } },
      sort: '-publishedAt',
      limit: 1,
      depth: 1,
    }),
  ])

  const lookbook = lookbooks.docs[0]

  // Ingen fremhevet artikkel satt av redaktøren ennå — fall tilbake på den
  // sist publiserte, slik at journalteaseren ikke bare forsvinner.
  const article =
    featuredArticles.docs[0] ??
    (
      await payload.find({
        collection: 'articles',
        where: { _status: { equals: 'published' } },
        sort: '-publishedAt',
        limit: 1,
        depth: 1,
      })
    ).docs[0]

  const articleImageUrl = article ? mediaUrl(article.hero.image) : undefined

  // Forsidens topp er redaksjonelt innhold, ikke fast mal: en butikkeier skal
  // kunne endre merkevareteksten uten utvikler.
  const frontpage = await payload.findGlobal({ slug: 'frontpage', depth: 1 })
  const frontpageImageUrl = mediaUrl(frontpage.image)

  return (
    <div>
      <section className={styles.hero}>
        {frontpage.eyebrow ? (
          <Eyebrow as="span" style={{ display: 'block' }}>
            {frontpage.eyebrow}
          </Eyebrow>
        ) : null}
        <h1 className={styles.title}>
          {frontpage.title}
          {frontpage.titleItalic ? (
            <>
              <br />
              <em className={styles.italic}>{frontpage.titleItalic}</em>
            </>
          ) : null}
        </h1>
        {frontpage.lead ? <p className={styles.leadHero}>{frontpage.lead}</p> : null}
      </section>

      <section className={styles.heroGrid}>
        {frontpageImageUrl ? (
          <img
            src={frontpageImageUrl}
            alt={mediaAlt(frontpage.image)}
            style={{ aspectRatio: '4 / 3', objectFit: 'cover' }}
          />
        ) : (
          <div className="st-media" style={{ aspectRatio: '4 / 3' }} role="presentation" />
        )}

        {lookbook ? (
          <div>
            <Eyebrow as="span" style={{ display: 'block' }}>
              {lookbook.season ?? 'Ny samling'}
            </Eyebrow>
            <h2 className={styles.h2}>{lookbook.title}</h2>
            {lookbook.intro ? <p className={styles.lookbookIntro}>{lookbook.intro}</p> : null}
            {/*
              Teaseren handler om denne lookbooken, ikke om hele sortimentet —
              lerretet sender «Se samlingen» til samlingsskjermen, ikke til
              katalogen. «Se alle» under utvalgte objekter er veien til katalogen.
            */}
            <Button variant="secondary" icon="arrow-right" href={`/samlinger/${lookbook.slug}`}>
              Se samlingen
            </Button>
          </div>
        ) : null}
      </section>

      {featured.docs.length > 0 ? (
        <>
          <div className={styles.sectionHead}>
            <h2>Utvalgte objekter</h2>
            <Link href="/samlingen" className="st-nav-link">
              Se alle
            </Link>
          </div>
          <div className={styles.grid3}>
            {featured.docs.map((product) => {
              const image = product.images?.[0]?.image
              return (
                <ProductCardAdd
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  title={product.title}
                  category={categoryLabel(product.category)}
                  priceInNOK={product.priceInNOK ?? 0}
                  imageUrl={mediaUrl(image)}
                  imageAlt={mediaAlt(image, product.title)}
                />
              )
            })}
          </div>
        </>
      ) : null}

      {article ? (
        <section className={styles.journalGrid}>
          {articleImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={articleImageUrl}
              alt={mediaAlt(article.hero.image, article.hero.alt ?? article.title)}
              className={styles.journalImage}
            />
          ) : (
            <div
              className={`st-media ${styles.journalImage}`}
              role="img"
              aria-label={article.title}
            />
          )}
          <div>
            <Eyebrow as="span" style={{ display: 'block' }}>
              Journal / {ARTICLE_CATEGORY_LABEL[article.category]}
              {article.readingTime ? ` · ${article.readingTime} min lesetid` : ''}
            </Eyebrow>
            <h2 className={styles.h2}>{article.title}</h2>
            {article.lead ? <p className={styles.journalLead}>{article.lead}</p> : null}
            <Button variant="secondary" icon="arrow-right" href={`/journal/${article.slug}`}>
              Les fortellingen
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
