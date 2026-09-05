import type { Block } from 'payload'

/**
 * Bilde ved siden av tekst. `imageSide` styrer hvilken side bildet vises på.
 */
export const ImageTextBlock: Block = {
  slug: 'imageText',
  interfaceName: 'ImageTextBlock',
  labels: {
    singular: 'Bilde og tekst',
    plural: 'Bilde og tekst-blokker',
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Bilde',
      required: true,
      admin: {
        description: 'Anbefalt bildeforhold 4:5.',
      },
    },
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Overtittel',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Tittel',
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Tekst',
    },
    {
      name: 'imageSide',
      type: 'select',
      label: 'Bildeplassering',
      required: true,
      defaultValue: 'left',
      options: [
        { label: 'Venstre', value: 'left' },
        { label: 'Høyre', value: 'right' },
      ],
    },
  ],
}
