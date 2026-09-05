import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

import { calculateTotals, toVatRate, type Line } from '@/money'

import { createStripeClient, type StripeAdapterConfig } from './index'

/**
 * Starter en betaling.
 *
 * Det viktigste her er hvor beløpet kommer fra: kurven hentes på nytt fra
 * databasen på ID, og totalen regnes ut av `src/money`. Beløpet som sendes til
 * Stripe er aldri det klienten oppga. `data.cart` kommer fra requesten og kan
 * være manipulert — den brukes bare til å finne kurvens ID.
 *
 * Pluginens egen adapter bruker `cart.subtotal` fra requesten direkte. Det er
 * både usikkert og feil så snart frakt er med i bildet.
 */
export const initiatePayment =
  (config: StripeAdapterConfig): PaymentAdapter['initiatePayment'] =>
  async ({ data, req }) => {
    const { payload } = req
    const stripe = createStripeClient(config.secretKey)

    const customerEmail = data.customerEmail
    if (!customerEmail || typeof customerEmail !== 'string') {
      throw new Error('En gyldig e-postadresse er nødvendig for å betale.')
    }

    const cartID = data.cart?.id
    if (!cartID) {
      throw new Error('Kurven mangler.')
    }

    // Kurven leses fra databasen, ikke fra requesten.
    const cart = await payload.findByID({
      collection: 'carts',
      id: cartID,
      depth: 2,
      req,
    })

    const items = cart.items ?? []
    if (items.length === 0) {
      throw new Error('Kurven er tom.')
    }

    const lines: Line[] = items.map((item) => {
      const product = item.product
      if (!product || typeof product === 'number') {
        throw new Error('Kurvlinjen mangler produktdata. Kjør spørringen med større depth.')
      }
      return {
        unitGross: product.priceInNOK ?? 0,
        quantity: item.quantity ?? 1,
        vatRate: toVatRate(product.vatRate),
      }
    })

    const shop = await payload.findGlobal({ slug: 'shop', req })
    const itemsGross = lines.reduce((sum, line) => sum + line.unitGross * line.quantity, 0)
    const threshold = shop.freeShippingThreshold
    const freeShipping = typeof threshold === 'number' && itemsGross >= threshold
    const shippingGross = freeShipping ? 0 : (shop.shippingCost ?? 0)

    // Frakt følger hovedvarens sats i norsk rett. Modellen har ingen egen sats
    // for frakt, så standardsatsen brukes — se spec-ens avsnitt 3.1.
    const totals = calculateTotals(lines, { gross: shippingGross, vatRate: 25 })

    const stripeCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 })
    const customer =
      stripeCustomers.data[0] ?? (await stripe.customers.create({ email: customerEmail }))

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totals.grandTotalGross,
      currency: 'nok',
      customer: customer.id,
      // Vipps, Klarna og kort styres fra Stripe-kontoens innstillinger, ikke
      // fra kode. Vipps dukker opp her når previewen er innvilget.
      automatic_payment_methods: { enabled: true },
      metadata: {
        cartID: String(cartID),
        itemsGross: String(totals.itemsGross),
        shippingGross: String(totals.shippingGross),
        totalVat: String(totals.totalVat),
      },
    })

    await payload.create({
      collection: 'transactions',
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        amount: totals.grandTotalGross,
        cart: cartID,
        currency: 'NOK',
        paymentMethod: 'stripe',
        status: 'pending',
        stripe: { customerID: customer.id, paymentIntentID: paymentIntent.id },
      },
      req,
    })

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      paymentIntentID: paymentIntent.id,
      message: 'Betalingen er startet.',
    }
  }
