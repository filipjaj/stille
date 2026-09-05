import type { Block } from 'payload'

/**
 * Fremhever én artikkel. `latest` viser siste publiserte artikkel automatisk,
 * `pick` lar redaktøren velge en spesifikk artikkel.
 */
export const ArticleTeaserBlock: Block = {
  slug: 'articleTeaser',
  interfaceName: 'ArticleTeaserBlock',
  labels: {
    singular: 'Artikkel-teaser',
    plural: 'Artikkel-teaser-blokker',
  },
  fields: [
    {
      name: 'source',
      type: 'select',
      label: 'Kilde',
      required: true,
      defaultValue: 'latest',
      options: [
        { label: 'Siste artikkel', value: 'latest' },
        { label: 'Valgt artikkel', value: 'pick' },
      ],
    },
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'articles',
      label: 'Artikkel',
      admin: {
        description: 'Vises kun når kilde er "Valgt artikkel".',
        condition: (_, siblingData) => siblingData?.source === 'pick',
      },
    },
  ],
}
