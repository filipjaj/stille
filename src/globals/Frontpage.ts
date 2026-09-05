import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/ecommerce/access'

/**
 * Forsidens redaksjonelle topp.
 *
 * Designets datamodell har ingen global for dette — lerretet behandler
 * merkevareteksten som fast. Men en butikkeier skal kunne endre «Rom for det
 * vesentlige» uten å hente en utvikler, og premisset for hele prosjektet er at
 * alt innhold kommer fra Payload. Forsiden har en fast komposisjon (topp,
 * samlingsteaser, utvalgte objekter, journalteaser) og passer derfor dårlig i
 * `pages`-blokkene, som er laget for frie sider. En singleton er riktigere.
 */
export const Frontpage: GlobalConfig = {
  slug: 'frontpage',
  label: 'Forside',
  admin: {
    group: 'Innhold',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Stikktittel',
      admin: { description: 'Liten versal over overskriften, f.eks. «Samling / 01».' },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Overskrift',
      required: true,
      admin: { description: 'Første linje, i vanlig snitt.' },
    },
    {
      name: 'titleItalic',
      type: 'text',
      label: 'Overskrift, kursiv linje',
      admin: {
        description: 'Andre linje, settes i kursiv serif. La stå tom for én linje.',
      },
    },
    {
      name: 'lead',
      type: 'textarea',
      label: 'Ingress',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Toppbilde',
    },
  ],
}
