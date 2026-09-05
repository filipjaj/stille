import type { CollectionConfig } from 'payload'

import { isAdmin, adminOrPublishedStatus } from '@/ecommerce/access'
import { blocks } from '@/blocks'
import { seoFields } from '@/fields/seo'

/**
 * Frittstående sider bygget av blokker. Eneste collection med
 * utkast/versjonering påslått, så administratorer kan forhåndsvise
 * ferdig innhold før publisering.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'navPlacement', 'updatedAt'],
    group: 'Innhold',
  },
  versions: {
    drafts: true,
  },
  access: {
    read: adminOrPublishedStatus,
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
      name: 'layout',
      type: 'blocks',
      label: 'Innhold',
      blocks,
    },
    {
      // Ikke spesifisert i detalj av designet — antatt å styre om og hvor
      // siden lenkes fra i navigasjonen. Se rapport.
      name: 'navPlacement',
      type: 'select',
      label: 'Plassering i navigasjon',
      defaultValue: 'none',
      options: [
        { label: 'Ingen', value: 'none' },
        { label: 'Header', value: 'header' },
        { label: 'Footer', value: 'footer' },
        { label: 'Header og footer', value: 'both' },
      ],
    },
    ...seoFields,
  ],
}
