import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/ecommerce/access'

/**
 * Enkeltstående spørsmål/svar-par. Brukes av `faq`-blokken på sider.
 * `order` styrer rekkefølgen når de vises, siden det ikke finnes noen
 * naturlig sorteringsnøkkel ellers.
 */
export const Faqs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'order'],
    group: 'Innhold',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      label: 'Spørsmål',
      required: true,
    },
    {
      name: 'answer',
      type: 'textarea',
      label: 'Svar',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      label: 'Rekkefølge',
      defaultValue: 0,
      admin: {
        description: 'Lavest tall vises først.',
      },
    },
  ],
}
