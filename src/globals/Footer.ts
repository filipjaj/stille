import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/ecommerce/access'

/**
 * Lenker og en kort tekst i bunnen av siden. Samme lenkeform som header
 * (intern side eller ekstern URL) for konsistens.
 */
export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Innhold',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'links',
      type: 'array',
      label: 'Lenker',
      labels: {
        singular: 'Lenke',
        plural: 'Lenker',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Tekst',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          label: 'Type',
          required: true,
          defaultValue: 'internal',
          options: [
            { label: 'Intern side', value: 'internal' },
            { label: 'Ekstern URL', value: 'external' },
          ],
        },
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          label: 'Side',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'internal',
          },
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'external',
          },
        },
      ],
    },
    {
      name: 'text',
      type: 'textarea',
      label: 'Kort tekst',
    },
  ],
}
