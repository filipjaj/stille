'use client'

import React from 'react'

import { Icon } from './Icon'

export type PaginationProps = {
  page?: number
  total?: number
  onChange?: (page: number) => void
  prevLabel?: string
  nextLabel?: string
  className?: string
} & Omit<React.HTMLAttributes<HTMLElement>, 'className'>

/**
 * Regner ut hvilke sidetall som skal vises. Under 8 sider vises alle.
 * Ellers vises første, siste, og et vindu rundt gjeldende side, med
 * `'gap' + n` som markør for hull som skal rendres som "…".
 */
function range(page: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const s = new Set([1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total))
  const out: (number | string)[] = []
  let prev = 0
  for (const n of [...s].sort((a, b) => a - b)) {
    if (n - prev > 1) out.push('gap' + n)
    out.push(n)
    prev = n
  }
  return out
}

/**
 * Sidenumre — rad med hårfin topplinje: forrige / numrede sider (gjeldende
 * boksfarget i blekk) / neste. Portert fra designprosjektets
 * _ref/components/navigation/Pagination.jsx.
 */
export function Pagination({
  page = 1,
  total = 1,
  onChange = () => {},
  prevLabel = 'Forrige',
  nextLabel = 'Neste',
  className,
  ...rest
}: PaginationProps) {
  const classes = ['st-pagination', className].filter(Boolean).join(' ')

  const go = (n: number) => {
    if (n >= 1 && n <= total && n !== page) onChange(n)
  }

  return (
    <nav aria-label="Sidenavigasjon" className={classes} {...rest}>
      <button
        type="button"
        className="st-page-nav prev"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        <Icon name="arrow-left" size={20} weight="thin" />
        <span>{prevLabel}</span>
      </button>
      <ol>
        {range(page, total).map((n) =>
          typeof n === 'string' ? (
            <li key={n} className="st-page-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                className="st-page"
                aria-current={n === page ? 'page' : undefined}
                aria-label={'Side ' + n}
                onClick={() => go(n)}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ol>
      <button
        type="button"
        className="st-page-nav next"
        disabled={page >= total}
        onClick={() => go(page + 1)}
      >
        <span>{nextLabel}</span>
        <Icon name="arrow-right" size={20} weight="thin" />
      </button>
    </nav>
  )
}
