import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import type { Currency } from '@payloadcms/plugin-ecommerce/types'

import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
} from './access'
import { productContentFields } from './fields/product'
import { vatRateField } from './fields/vatRate'

/** Norske kroner. `decimals: 2` gjør at plugin-en lagrer priser i øre. */
export const NOK: Currency = {
  code: 'NOK',
  decimals: 2,
  label: 'Norske kroner',
  symbol: 'kr',
  symbolDisplay: 'symbol',
}

export const ecommerce = ecommercePlugin({
  access: {
    adminOnlyFieldAccess,
    adminOrPublishedStatus,
    isAdmin,
    isAuthenticated,
    isCustomer,
    isDocumentOwner,
  },
  currencies: {
    defaultCurrency: 'NOK',
    supportedCurrencies: [NOK],
  },
  customers: {
    slug: 'users',
  },
  payments: {
    // Adaptere kommer i milepæl 4a. Tom liste er en gyldig konfigurasjon.
    paymentMethods: [],
  },
  products: {
    productsCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      admin: {
        ...defaultCollection.admin,
        useAsTitle: 'title',
        defaultColumns: ['title', 'sku', 'priceInNOK', 'inventory', '_status'],
      },
      fields: [...defaultCollection.fields, ...productContentFields, vatRateField],
    }),
  },
})
