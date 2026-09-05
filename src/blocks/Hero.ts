import type { Block } from 'payload'

/**
 * Toppseksjon med stort bilde. Brukes typisk øverst på forsider og landingssider.
 */
export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: 'Hero',
    plural: 'Hero-blokker',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Overtittel',
      admin: {
        description: 'Kort tekst over hovedtittelen, f.eks. en kategori eller kampanjenavn.',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Tittel',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Bilde',
      required: true,
      admin: {
        description: 'Anbefalt bildeforhold 3:2.',
      },
    },
  ],
}
