import { mediaAlt, mediaUrl } from '@/lib/media'
import type { GalleryBlock as GalleryBlockType } from '@/payload-types'

import styles from './Gallery.module.css'

/** Bildegalleri med 2–3 bilder side ved side, hver med valgfri billedtekst. */
export function GalleryBlockComponent({ block }: { block: GalleryBlockType }) {
  const images = block.images ?? []
  if (images.length === 0) return null

  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${images.length}, minmax(0, 1fr))` }}
    >
      {images.map((item, index) => {
        const src = mediaUrl(item.image)
        return (
          <figure key={item.id ?? index} className={styles.item}>
            {src ? (
              <img src={src} alt={mediaAlt(item.image, item.caption)} />
            ) : (
              <div className={`st-media ${styles.placeholder}`} />
            )}
            {item.caption ? (
              <figcaption className={styles.caption}>{item.caption}</figcaption>
            ) : null}
          </figure>
        )
      })}
    </div>
  )
}
