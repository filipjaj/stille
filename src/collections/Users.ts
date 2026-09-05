import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'saved',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Lagrede objekter',
      admin: {
        description:
          'Produkter kunden har lagret. Ligger på brukeren og ikke i nettleseren, så lista følger kontoen mellom enheter.',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['customer'],
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Kunde', value: 'customer' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
