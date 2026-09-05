import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/ecommerce/access'

/**
 * Produktkategorier. Rent innhold uten publiseringsstatus — kategorisiden
 * skal alltid være synlig når den finnes, så lesing er åpen for alle.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
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
      name: 'title',
      type: 'text',
      label: 'Tittel',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Ingress',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Bilde',
    },
  ],
}
