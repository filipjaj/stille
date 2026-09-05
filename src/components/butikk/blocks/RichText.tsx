import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

import type { RichTextBlock as RichTextBlockType } from '@/payload-types'

import styles from './RichText.module.css'

/** Fri brødtekst rendret med Payloads egne Lexical-konvertere. */
export function RichTextBlockComponent({ block }: { block: RichTextBlockType }) {
  return (
    <div className={styles.wrap}>
      <LexicalRichText data={block.body} />
    </div>
  )
}
