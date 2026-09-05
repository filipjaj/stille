import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

/**
 * Fri tekstblokk med Lexical-editor. Brukes til lengre brødtekst i layouten.
 */
export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: {
    singular: 'Tekst',
    plural: 'Tekstblokker',
  },
  fields: [
    {
      name: 'body',
      type: 'richText',
      label: 'Tekst',
      editor: lexicalEditor(),
      required: true,
    },
  ],
}
