import React from 'react'

/** Ett ledd i brødsmulestien. Uten `href` (eller på siste ledd) rendres det som ren tekst. */
export type BreadcrumbItem = {
  label: string
  href?: string
}

export type BreadcrumbsProps = {
  items?: BreadcrumbItem[]
  className?: string
} & Omit<React.HTMLAttributes<HTMLElement>, 'className'>

/**
 * Brødsmulesti — 12px sti separert med skråstreker; siste ledd er
 * gjeldende side i dempet blekk. Portert fra designprosjektets
 * _ref/components/navigation/Breadcrumbs.jsx.
 *
 * Ren presentasjon, ingen state eller event-handlere — trenger ikke
 * `'use client'`.
 */
export function Breadcrumbs({ items = [], className, ...rest }: BreadcrumbsProps) {
  const classes = ['st-crumbs', className].filter(Boolean).join(' ')

  return (
    <nav aria-label="Brødsmuler" className={classes} {...rest}>
      <ol>
        {items.map((it, i) => {
          const last = i === items.length - 1
          return (
            <li key={i}>
              {last || !it.href ? (
                <span aria-current={last ? 'page' : undefined}>{it.label}</span>
              ) : (
                <a href={it.href}>{it.label}</a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
