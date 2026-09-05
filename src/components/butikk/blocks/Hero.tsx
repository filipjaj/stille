import { Eyebrow } from '@/components/stille/Eyebrow'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { HeroBlock as HeroBlockType } from '@/payload-types'

import styles from './Hero.module.css'

/**
 * Toppseksjon: overtittel, tittel og et fullbredde 3:2-bilde under.
 * Matcher header-mønsteret i «Om oss»-skjermen i designet.
 */
export function HeroBlockComponent({ block }: { block: HeroBlockType }) {
  const image = mediaUrl(block.image)

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
        <h1>{block.title}</h1>
      </div>
      {image ? (
        <img src={image} alt={mediaAlt(block.image)} className={styles.image} />
      ) : (
        <div className="st-media" style={{ aspectRatio: '3/2' }} />
      )}
    </section>
  )
}
