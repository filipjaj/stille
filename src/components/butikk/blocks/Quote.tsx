import type { QuoteBlock as QuoteBlockType } from '@/payload-types'

import styles from './Quote.module.css'

/** Fremhevet sitat med hårfin venstrestrek, slik designet bruker det flere steder. */
export function QuoteBlockComponent({ block }: { block: QuoteBlockType }) {
  return (
    <blockquote className={styles.quote}>
      <p style={{ margin: 0 }}>{block.quote}</p>
      {block.source ? <cite className={styles.source}>{block.source}</cite> : null}
    </blockquote>
  )
}
