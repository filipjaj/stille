import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/stille/Button'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { Field } from '@/components/stille/Field'
import { ProductCard } from '@/components/stille/ProductCard'
import { formatOre } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'

import styles from './sok.module.css'

export const metadata: Metadata = {
  title: 'Søk',
  description: 'Søk i samlingen og journalen.',
}

type SearchParams = { q?: string }

function SearchHeader({ query }: { query: string }) {
  return (
    <div className={styles.header}>
      <Eyebrow>Søk</Eyebrow>
      <h1>
        Hva leter
        <br />
        <em>du etter?</em>
      </h1>
      <form action="/sok" method="get" className={styles.form}>
        <Field
          inline
          label="Søk i samlingen og journalen"
          icon="magnifying-glass"
          placeholder="Prøv keramikk, lin eller lys"
          name="q"
          defaultValue={query}
          autoFocus
        />
      </form>
    </div>
  )
}

/**
 * Søk i produkter og journalartikler. Rendres helt server-side — skjemaet
 * er en vanlig GET-form, så søket fungerer uten klient-JS.
 */
export default async function SokPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  const payload = await getPayloadClient()

  if (!query) {
    const [products, articles] = await Promise.all([
      payload.count({ collection: 'products', where: { _status: { equals: 'published' } } }),
      payload.count({ collection: 'articles' }),
    ])

    return (
      <div>
        <SearchHeader query={query} />
        <p className={styles.count}>
          Skriv for å søke i {products.totalDocs} objekter og {articles.totalDocs} fortellinger.
        </p>
      </div>
    )
  }

  const [productResult, articleResult] = await Promise.all([
    payload.find({
      collection: 'products',
      where: {
        and: [
          { _status: { equals: 'published' } },
          {
            or: [
              { title: { like: query } },
              { description: { like: query } },
              { tags: { like: query } },
            ],
          },
        ],
      },
      depth: 1,
      limit: 24,
    }),
    payload.find({
      collection: 'articles',
      where: {
        or: [{ title: { like: query } }, { lead: { like: query } }],
      },
      depth: 1,
      limit: 12,
    }),
  ])

  const totalHits = productResult.totalDocs + articleResult.totalDocs

  return (
    <div>
      <SearchHeader query={query} />
      <p className={styles.count}>
        {totalHits} {totalHits === 1 ? 'treff' : 'treff'} for «{query}»
      </p>

      {productResult.docs.length > 0 ? (
        <div className={styles.grid}>
          {productResult.docs.map((product) => {
            const image = product.images?.[0]?.image
            const category =
              typeof product.category === 'object' ? product.category?.title : undefined

            return (
              <ProductCard
                key={product.id}
                image={mediaUrl(image)}
                alt={mediaAlt(image)}
                title={product.title}
                category={category ?? ''}
                price={formatOre(product.priceInNOK ?? 0)}
                href={`/produkt/${product.slug}`}
              />
            )
          })}
        </div>
      ) : null}

      {articleResult.docs.length > 0 ? (
        <section className={styles.articles}>
          <h2>I journalen</h2>
          <div className={styles.articleGrid}>
            {articleResult.docs.map((article) => {
              const image = mediaUrl(article.hero?.image)
              return (
                <Link
                  key={article.id}
                  href={`/journal/${article.slug}`}
                  className={styles.articleCard}
                >
                  {image ? (
                    <img src={image} alt={mediaAlt(article.hero?.image, article.hero?.alt)} />
                  ) : (
                    <div className={`st-media ${styles.thumb}`} />
                  )}
                  <div>
                    <Eyebrow>{article.category}</Eyebrow>
                    <h3>{article.title}</h3>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {totalHits === 0 ? (
        <div className={styles.noHits}>
          <h2>Ingen treff denne gangen.</h2>
          <p>Prøv et annet ord eller utforsk hele samlingen.</p>
          <Button href="/samlingen" variant="secondary" icon="arrow-right">
            Se samlingen
          </Button>
        </div>
      ) : null}
    </div>
  )
}
