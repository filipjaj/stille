import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/ecommerce/access'

/**
 * Navigasjonslenker i header. Hver lenke peker enten på en intern side eller
 * en ekstern URL — dette skillet er ikke spesifisert av designet i detalj,
 * men er nødvendig for at en lenke faktisk skal føre noe sted. Se rapport.
 */
export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  admin: {
    group: 'Innhold',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'nav',
      type: 'array',
      label: 'Navigasjonslenker',
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
  ],
}
