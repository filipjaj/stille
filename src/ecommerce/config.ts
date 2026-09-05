import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'

import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
} from './access'
import { productContentFields } from './fields/product'
import { NOK } from './currency'
import { vatRateField } from './fields/vatRate'

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

export { NOK }
