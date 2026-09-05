import type { Field } from 'payload'

/**
 * Gjenbrukbart SEO-feltsett. Legges til med spread (`...seoFields`) i
 * `fields`-arrayen til collections som trenger å overstyre meta-tagger
 * uavhengig av det synlige innholdet (i dag: articles og pages).
 *
 * Alle felt er valgfrie — når de står tomme skal frontend falle tilbake til
 * det vanlige innholdet (tittel, ingress/lead, hero-bilde).
 */
export const seoFields: Field[] = [
  {
    name: 'seo',
    type: 'group',
    label: 'SEO',
    admin: {
      description:
        'Overstyrer tittel, beskrivelse og delingsbilde for søkemotorer og sosiale medier. Stå tomt for å bruke innholdet på siden.',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'SEO-tittel',
      },
      {
        name: 'description',
        type: 'textarea',
        label: 'SEO-beskrivelse',
      },
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        label: 'Delingsbilde',
        admin: {
          description: 'Vises når siden deles i sosiale medier (Open Graph).',
        },
      },
    ],
  },
]
