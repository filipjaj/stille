import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/ecommerce/access'

/**
 * Tekstene for nyhetsbrev-seksjonen som vises globalt (f.eks. i footer).
 * Samme felt-form som `newsletter`-blokken, som lar redaktøren plassere en
 * egen variant midt i en side.
 */
export const Newsletter: GlobalConfig = {
  slug: 'newsletter',
  label: 'Nyhetsbrev',
  admin: {
    group: 'Innhold',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Overtittel',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Tittel',
      required: true,
    },
    {
      name: 'buttonLabel',
      type: 'text',
      label: 'Knappetekst',
      required: true,
    },
  ],
}
