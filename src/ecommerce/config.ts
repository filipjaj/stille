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
import { stripeAdapter } from '@/payments/stripe'

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
    paymentMethods: [
      stripeAdapter({
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET,
      }),
    ],
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
