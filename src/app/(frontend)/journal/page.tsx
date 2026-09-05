import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { EmptyState } from '@/components/stille/EmptyState'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import type { Article } from '@/payload-types'

import { JOURNAL_CATEGORIES, JOURNAL_CATEGORY_LABELS, isJournalCategory } from './kategori'
import styles from './journal.module.css'

export const metadata: Metadata = {
  title: 'Journal',
}

type JournalPageProps = {
  searchParams: Promise<{ kategori?: string }>
}

/**
 * Journal — artikkelliste med kategorifilter.
 *
 * Filteret ligger i URL-en (`?kategori=rom`) og styrer Payload-spørringen
 * direkte i serverkomponenten, slik at en filtrert visning er delbar og
 * kommer ferdig rendret fra serveren.
 */
export default async function JournalPage({ searchParams }: JournalPageProps) {
  const { kategori } = await searchParams
  const activeCategory = isJournalCategory(kategori) ? kategori : undefined

  const payload = await getPayloadClient()
  const { docs: articles } = await payload.find({
    collection: 'articles',
    where: {
      _status: { equals: 'published' },
      ...(activeCategory ? { category: { equals: activeCategory } } : {}),
    },
    sort: '-publishedAt',
    depth: 1,
    limit: 50,
  })

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Eyebrow>Journal</Eyebrow>
        <h1 className={styles.title}>
          Fortellinger om
          <br />
          <em>det nære.</em>
        </h1>
        <p className={styles.lede}>
          Rom vi bor i, materialene de er laget av, og menneskene som lager dem.
        </p>
      </section>

      <nav className={styles.filter} aria-label="Filtrer etter kategori">
        <Link href="/journal" className={!activeCategory ? styles.active : undefined}>
          Alle
        </Link>
        {JOURNAL_CATEGORIES.map((value) => (
          <Link
            key={value}
            href={`/journal?kategori=${value}`}
            className={activeCategory === value ? styles.active : undefined}
          >
            {JOURNAL_CATEGORY_LABELS[value]}
          </Link>
        ))}
      </nav>

      {articles.length === 0 ? (
        <EmptyState title="Ingen artikler ennå" className={styles.empty}>
          {activeCategory
            ? `Vi har ikke publisert noe under «${JOURNAL_CATEGORY_LABELS[activeCategory]}» ennå.`
            : 'Journalen er tom foreløpig — kom tilbake snart.'}
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}

function ArticleCard({ article }: { article: Article }) {
  const image = mediaUrl(article.hero.image)
  const alt = mediaAlt(article.hero.image, article.hero.alt)

  return (
    <Link href={`/journal/${article.slug}`} className={styles.card}>
      {image ? (
        <img src={image} alt={alt} className={styles.cardImage} />
      ) : (
        <div className="st-media" style={{ aspectRatio: '3/2' }} />
      )}
      <div>
        <Eyebrow>{JOURNAL_CATEGORY_LABELS[article.category]}</Eyebrow>
        <h2 className={styles.cardTitle}>{article.title}</h2>
        {article.lead ? <p className={styles.cardLead}>{article.lead}</p> : null}
      </div>
    </Link>
  )
}
