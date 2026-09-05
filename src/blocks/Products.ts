import type { Block } from 'payload'

/**
 * Produktutvalg. Kilden avgjør hvor produktene hentes fra:
 * - `manual`: redaktøren velger produkter enkeltvis.
 * - `category`: alle produkter i en valgt kategori.
 * - `collection`: alle produkter i en valgt lookbook.
 *
 * Merk: `category` og `collection` er ikke en del av det opprinnelige
 * feltoppsettet fra designet, men er nødvendige for at kilde-valget faktisk
 * skal vite hvilken kategori/lookbook det gjelder. Se rapport for antakelsen.
 * Feltnavnet `collection` og verdien "collection" beholdes selv om
 * relasjonen peker til `lookbooks`-collection-en.
 */
export const ProductsBlock: Block = {
  slug: 'products',
  interfaceName: 'ProductsBlock',
  labels: {
    singular: 'Produktutvalg',
    plural: 'Produktutvalg-blokker',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Tittel',
      admin: {
        description: 'Valgfri overskrift for seksjonen.',
      },
    },
    {
      name: 'source',
      type: 'select',
      label: 'Kilde',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Manuelt utvalg', value: 'manual' },
        { label: 'Kategori', value: 'category' },
        { label: 'Lookbook', value: 'collection' },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Kategori',
      admin: {
        description: 'Vises kun når kilde er "Kategori".',
        condition: (_, siblingData) => siblingData?.source === 'category',
      },
    },
    {
      name: 'collection',
      type: 'relationship',
      relationTo: 'lookbooks',
      label: 'Lookbook',
      admin: {
        description: 'Vises kun når kilde er "Lookbook".',
        condition: (_, siblingData) => siblingData?.source === 'collection',
      },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Produkter',
      admin: {
        description: 'Vises kun når kilde er "Manuelt utvalg".',
        condition: (_, siblingData) => siblingData?.source === 'manual',
      },
    },
    {
      name: 'limit',
      type: 'number',
      label: 'Maks antall produkter',
      min: 1,
      defaultValue: 8,
    },
  ],
}
