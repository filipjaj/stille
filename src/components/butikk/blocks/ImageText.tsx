import { Eyebrow } from '@/components/stille/Eyebrow'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { ImageTextBlock as ImageTextBlockType } from '@/payload-types'

import styles from './ImageText.module.css'

/** Bilde ved siden av tekst. `imageSide` bytter rekkefølgen via `order`. */
export function ImageTextBlockComponent({ block }: { block: ImageTextBlockType }) {
  const image = mediaUrl(block.image)
  const imageFirst = block.imageSide !== 'right'

  return (
    <section className={styles.section}>
      <div style={{ order: imageFirst ? 1 : 2 }}>
        {image ? (
          <img src={image} alt={mediaAlt(block.image)} className={styles.image} />
        ) : (
          <div className="st-media" style={{ aspectRatio: '4/5' }} />
        )}
      </div>
      <div style={{ order: imageFirst ? 2 : 1 }}>
        {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
        {block.title ? <h2>{block.title}</h2> : null}
        {block.body ? <p className={styles.body}>{block.body}</p> : null}
      </div>
    </section>
  )
}
