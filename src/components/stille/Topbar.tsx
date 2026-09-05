import React from 'react'

export type TopbarProps = {
  title?: React.ReactNode
  /** Innhold over tittelen, f.eks. Eyebrow eller Breadcrumbs. */
  lead?: React.ReactNode
  /** Høyrestilte handlinger. */
  children?: React.ReactNode
  className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

/**
 * Topbar — siderad for tittel: valgfri eyebrow/breadcrumbs over en 30px
 * serif-tittel, handlinger høyrestilt. Portert fra
 * designsystemets components/admin/Topbar.jsx.
 */
export function Topbar({ title, lead, children, className, ...rest }: TopbarProps) {
  const classes = ['st-topbar', className].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      <div className="st-topbar-lead">
        {lead}
        {title && <h1>{title}</h1>}
      </div>
      {children && <div className="st-topbar-actions">{children}</div>}
    </div>
  )
}
