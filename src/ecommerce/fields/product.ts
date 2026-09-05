import type { Field } from 'payload'

import { seoFields } from '@/fields/seo'

/**
 * Innholdsfeltene på produkter.
 *
 * `plugin-ecommerce` lager en bevisst tynn `products`-collection: den eier
 * pris, lager og varianter, men ingenting av det redaksjonelle. Tittel, slug,
 * artikkelnummer, beskrivelse og bilder må vi legge til selv — uten dem har
 * butikkflatene ingenting å vise, og datamodellen i designprosjektet
 * forutsetter dem alle.
 */
export const productContentFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    label: 'Navn',
    required: true,
  },
  {
    name: 'slug',
    type: 'text',
    label: 'Slug',
    required: true,
    unique: true,
    index: true,
    admin: {
      description: 'Brukes i URL-en: /produkt/<slug>',
    },
  },
  {
    name: 'sku',
    type: 'text',
    label: 'Artikkelnummer',
    required: true,
    index: true,
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Kort beskrivelse',
    admin: {
      description: 'Vises på produktkortet og øverst på produktsiden.',
    },
  },
  {
    name: 'care',
    type: 'textarea',
    label: 'Materiale og pleie',
    admin: {
      description: 'Vises som eget panel på produktsiden, sammen med levering og retur.',
    },
  },
  {
    name: 'images',
    type: 'array',
    label: 'Bilder',
    labels: {
      singular: 'Bilde',
      plural: 'Bilder',
    },
    admin: {
      description: '4:5, minst 1600 px. Første bilde vises på produktkortet.',
    },
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        label: 'Bilde',
        required: true,
      },
    ],
  },
  {
    name: 'category',
    type: 'relationship',
    relationTo: 'categories',
    label: 'Kategori',
  },
  {
    name: 'lookbook',
    type: 'relationship',
    relationTo: 'lookbooks',
    label: 'Lookbook',
  },
  {
    name: 'compareAt',
    type: 'number',
    label: 'Førpris',
    admin: {
      description: 'Heltall i øre, som prisen. Tomt hvis produktet ikke er nedsatt.',
      step: 1,
    },
  },
  {
    name: 'tags',
    type: 'text',
    label: 'Merkelapper',
    admin: {
      description: 'Kommaseparert, for eksempel «keramikk, lin, stilleben».',
    },
  },
  ...seoFields,
]
