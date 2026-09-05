import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

import { adminOrPublishedStatus, isAdmin } from '@/ecommerce/access'
import { seoFields } from '@/fields/seo'

/**
 * Redaksjonelt innhold (magasindelen av butikken).
 *
 * Utkast er slått på: admin-lerretene i designprosjektet viser statusmerker
 * («Utkast», «Planlagt») på innhold, selv om datamodellen i oversikten utelot
 * `_status` på artikler. Redaksjonelt innhold uten utkast betyr at enhver
 * halvferdig tekst er live i det den lagres.
 *
 * `publishedAt` er noe annet enn status: den styrer datoen som vises og
 * sorteringen i journalen, ikke om artikkelen er synlig.
 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'author', 'publishedAt', 'featured'],
    group: 'Innhold',
  },
  access: {
    read: adminOrPublishedStatus,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  versions: {
    drafts: true,
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
      name: 'lead',
      type: 'textarea',
      label: 'Ingress',
    },
    {
      name: 'category',
      type: 'select',
      label: 'Kategori',
      required: true,
      options: [
        { label: 'Rom', value: 'rom' },
        { label: 'Materialer', value: 'materialer' },
        { label: 'Mennesker', value: 'mennesker' },
      ],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      label: 'Forfatter',
    },
    {
      name: 'readingTime',
      type: 'number',
      label: 'Lesetid (minutter)',
      min: 1,
    },
    {
      name: 'hero',
      type: 'group',
      label: 'Hero',
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
          name: 'alt',
          type: 'text',
          label: 'Alt-tekst',
          admin: {
            description: 'Overstyrer alt-teksten som ligger på selve mediefilen, for denne artikkelen spesifikt.',
          },
        },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Brødtekst',
      editor: lexicalEditor(),
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Nevnte produkter',
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Fremhevet',
      defaultValue: false,
      admin: {
        description: 'Fremhevede artikler kan plukkes ut spesielt i forsideoppsett.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Publiseringsdato',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    ...seoFields,
  ],
}
