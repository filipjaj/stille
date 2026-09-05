import type { CollectionConfig } from 'payload'
import { isAdmin } from '../ecommerce/access'

/**
 * Idempotensjournal for innkommende webhooks. D1 har ingen transaksjoner, så den
 * unike indeksen på `eventId` er mekanismen som hindrer dobbeltbehandling:
 * handleren oppretter raden først, og et duplikat feiler før noen sideeffekt skjer.
 */
export const WebhookEvents: CollectionConfig = {
  slug: 'webhook-events',
  admin: {
    useAsTitle: 'eventId',
    defaultColumns: ['eventId', 'provider', 'type', 'processedAt'],
    group: 'Ecommerce',
    description:
      'Behandlede webhook-hendelser. Slettes ikke automatisk — se milepæl 7 for opprydding.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: () => false,
  },
  fields: [
    {
      name: 'eventId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Hendelses-ID fra betalingsleverandøren, for eksempel evt_123.',
      },
    },
    {
      name: 'provider',
      type: 'text',
      required: true,
      admin: {
        description: 'Navnet på betalingsadapteren, for eksempel stripe.',
      },
    },
    {
      name: 'type',
      type: 'text',
      required: true,
    },
    {
      name: 'processedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
}
