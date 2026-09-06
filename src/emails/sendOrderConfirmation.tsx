import type { Payload } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'

import { formatOre, formatShipping } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import type { Ore } from '@/money'
import type { Order, Product } from '@/payload-types'

import { absoluteUrl, emailDocument } from './document'
import { OrderConfirmation, type OrderConfirmationLine } from './OrderConfirmation'

type Args = {
  payload: Payload
  order: Order
  email: string
  amounts: { subtotal: Ore; shipping: Ore; total: Ore }
  siteUrl?: string
}

/**
 * Sender ordrebekreftelsen.
 *
 * Kaster aldri. En e-post som ikke går ut skal ikke rulle tilbake en betaling
 * som er gjennomført — kunden har betalt, og ordren finnes. Feilen logges så
 * den kan følges opp, men kjøpet står.
 */
export async function sendOrderConfirmation({
  payload,
  order,
  email,
  amounts,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '',
}: Args): Promise<void> {
  try {
    const firstName = email.split('@')[0]

    const lines: OrderConfirmationLine[] = await Promise.all(
      (order.items ?? []).map(async (item): Promise<OrderConfirmationLine> => {
        const productRef = item.product
        let product: Product | undefined
        if (typeof productRef === 'object' && productRef !== null) {
          product = productRef as Product
        } else {
          try {
            product = await payload.findByID({
              collection: 'products',
              id: Number(productRef),
              depth: 1,
            })
          } catch {
            // Produktet er slettet siden ordren ble lagt. Linja vises med
            // fallback-tittel i stedet for at hele e-posten uteblir.
            product = undefined
          }
        }

        const quantity = item.quantity ?? 1
        const unit = product?.priceInNOK ?? 0

        return {
          title: product?.title ?? 'Objekt',
          meta: `${quantity} stk`,
          sum: formatOre(unit * quantity),
          // E-post har ingen base-URL: en relativ sti gir brutt bilde overalt.
          imageUrl: absoluteUrl(mediaUrl(product?.images?.[0]?.image), siteUrl),
        }
      }),
    )

    await payload.sendEmail({
      to: email,
      subject: `Ordrebekreftelse · ${order.id}`,
      html: emailDocument({
        title: `Ordrebekreftelse ${order.id}`,
        preheader: `Takk for bestillingen. Vi gjør ordre ${order.id} klar for sending.`,
        body: renderToStaticMarkup(
          OrderConfirmation({
            firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
            orderNo: String(order.id),
            lines,
            subtotal: formatOre(amounts.subtotal),
            shipping: formatShipping(amounts.shipping),
            total: formatOre(amounts.total),
            deliveryName: firstName,
            deliveryAddress: [],
            orderUrl: `${siteUrl}/konto`,
          }),
        ),
      }),
    })

    payload.logger.info(`Ordrebekreftelse sendt til ${email} for ordre ${order.id}.`)
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: `Klarte ikke å sende ordrebekreftelse for ordre ${order.id}. Kjøpet står.`,
    })
  }
}
