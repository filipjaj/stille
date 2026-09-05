import type { Block } from 'payload'

/**
 * Bildegalleri med 2–3 bilder, hvert med valgfri billedtekst.
 */
export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: {
    singular: 'Galleri',
    plural: 'Galleri-blokker',
  },
  fields: [
    {
      name: 'images',
      type: 'array',
      label: 'Bilder',
      minRows: 2,
      maxRows: 3,
      labels: {
        singular: 'Bilde',
        plural: 'Bilder',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Bilde',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Billedtekst',
        },
      ],
    },
  ],
}
