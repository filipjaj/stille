import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/ecommerce/access'

/**
 * Sesongsamlinger. Slug og navn er `lookbooks` — domenebegrepet designet bruker.
 */
export const Lookbooks: CollectionConfig = {
  slug: 'lookbooks',
  labels: {
    singular: 'Lookbook',
    plural: 'Lookbooks',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'season', 'slug'],
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
      name: 'season',
      type: 'text',
      label: 'Sesong',
      admin: {
        description: 'F.eks. "Høst 2026".',
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Ingress',
    },
    {
      name: 'looks',
      type: 'array',
      label: 'Looks',
      labels: {
        singular: 'Look',
        plural: 'Looks',
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
        {
          name: 'products',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          label: 'Produkter i looken',
        },
      ],
    },
  ],
}
