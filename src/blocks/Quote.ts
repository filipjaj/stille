import type { Block } from 'payload'

/**
 * Fremhevet sitat, f.eks. fra en kunde eller designer.
 */
export const QuoteBlock: Block = {
  slug: 'quote',
  interfaceName: 'QuoteBlock',
  labels: {
    singular: 'Sitat',
    plural: 'Sitat-blokker',
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      label: 'Sitat',
      required: true,
    },
    {
      name: 'source',
      type: 'text',
      label: 'Kilde',
      admin: {
        description: 'Hvem sitatet er hentet fra, f.eks. navn og tittel.',
      },
    },
  ],
}
