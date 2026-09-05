import type { Block } from 'payload'

/**
 * Påmeldingsseksjon for nyhetsbrev. Samme feltform som `newsletter`-globalen,
 * men lar redaktøren plassere en egen variant midt i en side.
 */
export const NewsletterBlock: Block = {
  slug: 'newsletter',
  interfaceName: 'NewsletterBlock',
  labels: {
    singular: 'Nyhetsbrev',
    plural: 'Nyhetsbrev-blokker',
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
