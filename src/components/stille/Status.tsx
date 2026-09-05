import React from 'react'

export type StatusProps = {
  /** fixed = festet nederst midtstilt (toast). false = inline. Standard: true. */
  fixed?: boolean
  className?: string
  children?: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

/**
 * Status — levende statusmelding: ink-blokk med papirfarget tekst. Festet
 * toast nederst som standard, inline når fixed=false. Portert fra
 * designprosjektets _ref/components/core/Status.jsx.
 */
export function Status({ children, fixed = true, className, ...rest }: StatusProps) {
  if (!children) {
    return <div role="status" aria-live="polite" />
  }

  const classes = ['st-status', fixed ? 'fixed' : null, className].filter(Boolean).join(' ')

  return (
    <div role="status" aria-live="polite" className={classes} {...rest}>
      {children}
    </div>
  )
}
