import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/ecommerce/access'
import type { Ore } from '@/money'

/**
 * Butikk-innstillinger som ikke hører hjemme i ecommerce-plugin-ens egne
 * collections: frakt og hvilke betalingsmetoder som tilbys.
 * Beløp lagres som `Ore` (heltall i øre) — aldri kroner eller desimaler.
 */
const validateOre = (value: unknown): string | true => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return 'Beløpet må være et heltall i øre, ikke kroner eller desimaltall.'
  }
  const ore: Ore = value
  if (ore < 0) {
    return 'Beløpet kan ikke være negativt.'
  }
  return true
}

export const Shop: GlobalConfig = {
  slug: 'shop',
  label: 'Butikk',
  admin: {
    group: 'Innhold',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'shippingCost',
      type: 'number',
      label: 'Frakt (øre)',
      required: true,
      min: 0,
      validate: validateOre,
      admin: {
        description: 'Standard fraktkostnad i øre, f.eks. 9900 for 99 kroner.',
      },
    },
    {
      name: 'freeShippingThreshold',
      type: 'number',
      label: 'Fri frakt-grense (øre)',
      min: 0,
      validate: validateOre,
      admin: {
        description: 'Ordreverdi (i øre) som gir gratis frakt. Stå tomt for å aldri gi fri frakt.',
      },
    },
    {
      name: 'paymentMethods',
      type: 'select',
      label: 'Betalingsmetoder',
      hasMany: true,
      required: true,
      defaultValue: ['card'],
      options: [
        { label: 'Vipps', value: 'vipps' },
        { label: 'Kort', value: 'card' },
        { label: 'Klarna', value: 'klarna' },
      ],
    },
  ],
}
