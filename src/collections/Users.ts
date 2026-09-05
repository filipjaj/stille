import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
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
