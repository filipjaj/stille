import { Button } from '@/components/stille/Button'
import { EmptyState } from '@/components/stille/EmptyState'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { getPayloadClient } from '@/lib/payload'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { Article, ArticleTeaserBlock as ArticleTeaserBlockType } from '@/payload-types'

import styles from './ArticleTeaser.module.css'

const CATEGORY_LABEL: Record<Article['category'], string> = {
  rom: 'Rom',
  materialer: 'Materialer',
  mennesker: 'Mennesker',
}

async function resolveArticle(block: ArticleTeaserBlockType): Promise<Article | null> {
  const payload = await getPayloadClient()

  if (block.source === 'pick') {
    const picked = block.article
    if (typeof picked === 'object' && picked) return picked
    if (typeof picked === 'number') {
      try {
        return await payload.findByID({ collection: 'articles', id: picked })
      } catch {
        return null
      }
    }
    return null
  }

  const result = await payload.find({
    collection: 'articles',
    sort: '-publishedAt',
    limit: 1,
  })
  return result.docs[0] ?? null
}

/** Fremhever én artikkel. `latest` henter siste publiserte, `pick` en valgt. */
export async function ArticleTeaserBlockComponent({ block }: { block: ArticleTeaserBlockType }) {
  const article = await resolveArticle(block)

  if (!article) {
    return (
      <EmptyState title="Ingen artikkel ennå.">
        Journalen har ingen fortellinger å vise her ennå.
      </EmptyState>
    )
  }

  const image = mediaUrl(article.hero?.image)
  const meta = [
    CATEGORY_LABEL[article.category],
    article.readingTime ? `${article.readingTime} min lesetid` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className={styles.section}>
      {image ? (
        <img
          src={image}
          alt={mediaAlt(article.hero?.image, article.hero?.alt)}
          className={styles.image}
        />
      ) : (
        <div className="st-media" style={{ height: 580 }} />
      )}
      <div className={styles.body}>
        {meta ? <Eyebrow>{meta}</Eyebrow> : null}
        <h2>{article.title}</h2>
        {article.lead ? <p>{article.lead}</p> : null}
        <Button href={`/journal/${article.slug}`} variant="secondary" icon="arrow-right">
          Les fortellingen
        </Button>
      </div>
    </section>
  )
}
