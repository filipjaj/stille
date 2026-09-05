'use client'

import React from 'react'

export type SidebarItem = {
  /** Rendrer en gruppeoverskrift i stedet for en lenke når satt. */
  group?: string
  label?: React.ReactNode
  href?: string
  active?: boolean
  count?: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

export type SidebarProps = {
  items?: SidebarItem[]
  /** Produktnavn ved siden av "stille"-ordmerket. */
  product?: React.ReactNode
  brandHref?: string
  /** Innhold i bunnen av sidepanelet. */
  children?: React.ReactNode
  className?: string
} & Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'children'>

/**
 * Sidebar — 240px sidepanel med ordmerke, gruppert tekstnavigasjon (aktivt
 * element boksed i papir med ink-strek) og footer-slot. Portert fra
 * designsystemets components/admin/Sidebar.jsx.
 */
export function Sidebar({
  items = [],
  product = 'Admin',
  brandHref = '#',
  children,
  className,
  ...rest
}: SidebarProps) {
  const classes = ['st-sidebar', className].filter(Boolean).join(' ')

  return (
    <aside className={classes} {...rest}>
      <div className="st-sidebar-brand">
        <a href={brandHref}>stille</a>
        <span>{product}</span>
      </div>
      <nav aria-label="Hovedmeny">
        {items.map((it, i) =>
          it.group ? (
            <div key={i} className="st-sidebar-group">
              {it.group}
            </div>
          ) : (
            <a
              key={i}
              href={it.href ?? '#'}
              className="st-sidebar-item"
              aria-current={it.active ? 'page' : undefined}
              onClick={it.onClick}
            >
              <span>{it.label}</span>
              {it.count != null && <small>{it.count}</small>}
            </a>
          ),
        )}
      </nav>
      {children && <div className="st-sidebar-foot">{children}</div>}
    </aside>
  )
}
