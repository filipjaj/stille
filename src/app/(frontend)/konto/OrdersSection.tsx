import Link from 'next/link'

import { Badge, type BadgeTone } from '@/components/stille/Badge'
import { EmptyState } from '@/components/stille/EmptyState'
import { Table, type TableColumn } from '@/components/stille/Table'
import { TextLink } from '@/components/stille/TextLink'
import { formatOre } from '@/lib/format'
import type { Order, OrderStatus } from '@/payload-types'

import styles from './OrdersSection.module.css'

const STATUS_LABEL: Record<NonNullable<OrderStatus>, string> = {
  processing: 'Under behandling',
  completed: 'Fullført',
  cancelled: 'Kansellert',
  refunded: 'Refundert',
}

const STATUS_TONE: Record<NonNullable<OrderStatus>, BadgeTone> = {
  processing: 'info',
  completed: 'success',
  cancelled: 'neutral',
  refunded: 'warning',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Ordreliste og -detalj. `selected` styrer om vi viser tabellen eller én
 * ordre — begge kommer fra samme `?seksjon=ordre`-spørring i page.tsx.
 */
export function OrdersSection({ orders, selected }: { orders: Order[]; selected: Order | null }) {
  if (selected) {
    return <OrderDetail order={selected} />
  }

  if (orders.length === 0) {
    return (
      <section>
        <h2>Ordre</h2>
        <EmptyState title="Ingen bestillinger ennå.">
          Bestillinger dukker opp her så snart du har handlet.
        </EmptyState>
      </section>
    )
  }

  const columns: TableColumn<Order>[] = [
    { key: 'id', label: 'Ordre', render: (order) => `#${order.id}` },
    { key: 'createdAt', label: 'Dato', render: (order) => formatDate(order.createdAt) },
    {
      key: 'status',
      label: 'Status',
      render: (order) =>
        order.status ? (
          <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
        ) : null,
    },
    {
      key: 'amount',
      label: 'Sum',
      align: 'right',
      render: (order) => formatOre(order.amount ?? 0),
    },
    {
      key: 'link',
      label: '',
      render: (order) => <Link href={`/konto?seksjon=ordre&ordre=${order.id}`}>Se ordre</Link>,
    },
  ]

  return (
    <section>
      <h2>Ordre</h2>
      <Table columns={columns} rows={orders} rowKey="id" />
    </section>
  )
}

function OrderDetail({ order }: { order: Order }) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <h2>Ordre #{order.id}</h2>
        <TextLink href="/konto?seksjon=ordre">Alle ordre</TextLink>
      </div>

      {order.status ? (
        <div>
          <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
        </div>
      ) : null}

      <div className={styles.lines}>
        {(order.items ?? []).map((item, index) => {
          const title =
            typeof item.product === 'object' && item.product
              ? item.product.title
              : `Produkt #${item.product ?? '?'}`
          return (
            <div key={item.id ?? index} className={styles.line}>
              <span>
                {item.quantity} × {title}
              </span>
            </div>
          )
        })}
      </div>

      {order.shippingAddress ? (
        <address>
          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          <br />
          {order.shippingAddress.addressLine1}
          <br />
          {order.shippingAddress.postalCode} {order.shippingAddress.city}
        </address>
      ) : null}

      <div className={styles.summary}>
        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span>Totalt</span>
          <span>{formatOre(order.amount ?? 0)}</span>
        </div>
      </div>
    </div>
  )
}
