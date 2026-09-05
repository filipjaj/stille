import React from 'react'

export type EmptyStateProps = {
  title?: React.ReactNode
  /** Rendres som en dempet <p>-setning. */
  children?: React.ReactNode
  /** Valgfri handling, typisk en Button eller TextLink. */
  action?: React.ReactNode
  className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

/**
 * EmptyState — overflateblokk med serif-tittel, dempet setning og valgfri
 * handling. Portert fra designprosjektets
 * _ref/components/core/EmptyState.jsx.
 */
export function EmptyState({ title, action, children, className, ...rest }: EmptyStateProps) {
  const classes = ['st-empty', className].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      {title ? <h2>{title}</h2> : null}
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  )
}
