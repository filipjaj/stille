import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { Breadcrumbs } from '@/components/stille/Breadcrumbs'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { TextLink } from '@/components/stille/TextLink'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import type { Article } from '@/payload-types'

import { ProductTile, toProducts } from '../../_shared/product-tile'
import { JOURNAL_CATEGORY_LABELS } from '../kategori'
import styles from './artikkel.module.css'

type ArticlePageProps = {
  params: Promise<{ slug: string }>
}

/** Henter én publisert artikkel på slug, med produktene den nevner slått opp. */
async function getArticle(slug: string): Promise<Article | undefined> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    depth: 2,
    limit: 1,
  })
  return docs[0]
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return {}

  return {
    title: article.seo?.title || article.title,
    description: article.seo?.description || article.lead || undefined,
  }
}

/**
 * Artikkel — lesekolonne med hero, sitat fra brødteksten, objekter fra
 * fortellingen og lenker videre til flere fortellinger.
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  const payload = await getPayloadClient()
  const { docs: moreArticles } = await payload.find({
    collection: 'articles',
    where: {
      _status: { equals: 'published' },
      slug: { not_equals: article.slug },
    },
    sort: '-publishedAt',
    depth: 1,
    limit: 2,
  })

  const categoryLabel = JOURNAL_CATEGORY_LABELS[article.category]
  const heroImage = mediaUrl(article.hero.image)
  const heroAlt = mediaAlt(article.hero.image, article.hero.alt)
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('nb-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : undefined
  const author = article.author && typeof article.author === 'object' ? article.author : undefined
  const byline = [author?.email, publishedDate].filter(Boolean).join(' · ')
  const products = toProducts(article.products)

  return (
    <article className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Forside', href: '/' },
          { label: 'Journal', href: '/journal' },
          { label: article.title },
        ]}
      />

      <section className={styles.hero}>
        <Eyebrow>
          Journal / {categoryLabel}
          {article.readingTime ? ` · ${article.readingTime} min lesetid` : ''}
        </Eyebrow>
        <h1 className={styles.title}>{article.title}</h1>
        {byline ? <p className={styles.byline}>{byline}</p> : null}
      </section>

      <figure className={styles.figure}>
        {heroImage ? (
          <img src={heroImage} alt={heroAlt} className={styles.heroImage} />
        ) : (
          <div className="st-media" style={{ aspectRatio: '2/1' }} />
        )}
        {article.hero.caption ? <figcaption>{article.hero.caption}</figcaption> : null}
      </figure>

      {article.body ? (
        <div className={styles.body}>
          {/*
            RichText forventer Lexical-editorens egen state-type. Payloads
            genererte felttype for `body` er bevisst løs (`[k: string]: unknown`
            på nodene), så den lar seg ikke smalne til `SerializedEditorState`
            uten en cast — selve treet er identisk med det editoren skrev.
          */}
          <RichText data={article.body as Parameters<typeof RichText>[0]['data']} />
        </div>
      ) : null}

      {products.length > 0 ? (
        <section className={styles.objects}>
          <h2>Objekter fra fortellingen</h2>
          <div className={styles.objectsGrid}>
            {products.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {moreArticles.length > 0 ? (
        <section className={styles.more}>
          <div className={styles.moreHeader}>
            <h2>Flere fortellinger</h2>
            <TextLink href="/journal" icon="arrow-right">
              Journal
            </TextLink>
          </div>
          <div className={styles.moreGrid}>
            {moreArticles.map((more) => {
              const moreImage = mediaUrl(more.hero.image)
              const moreAlt = mediaAlt(more.hero.image, more.hero.alt)
              return (
                <a key={more.id} href={`/journal/${more.slug}`} className={styles.moreCard}>
                  {moreImage ? (
                    <img src={moreImage} alt={moreAlt} />
                  ) : (
                    <div className="st-media" style={{ aspectRatio: '3/2' }} />
                  )}
                  <div>
                    <Eyebrow>{JOURNAL_CATEGORY_LABELS[more.category]}</Eyebrow>
                    <h3>{more.title}</h3>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      ) : null}
    </article>
  )
}
