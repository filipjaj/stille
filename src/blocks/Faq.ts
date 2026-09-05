import type { Block } from 'payload'

/**
 * Liste med spørsmål og svar, hentet fra `faqs`-collection-en.
 */
export const FaqBlock: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: {
    singular: 'Spørsmål og svar',
    plural: 'Spørsmål og svar-blokker',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Tittel',
    },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      label: 'Spørsmål',
      required: true,
    },
  ],
}
