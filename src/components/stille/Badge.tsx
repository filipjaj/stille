import React from 'react'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'ink'

export type BadgeProps = {
  /** neutral = grå prikk og tynn ramme; øvrige toner fyller bakgrunnen. */
  tone?: BadgeTone
  /** Skjuler prikken foran teksten når false. */
  dot?: boolean
  className?: string
  children?: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>

/**
 * Badge — 12px statusmerke med prikk; tonene følger de dempede jordfargene
 * for status. Portert fra designsystemets components/admin/Badge.jsx.
 */
export function Badge({ tone = 'neutral', dot = true, className, children, ...rest }: BadgeProps) {
  const classes = ['st-badge', tone !== 'neutral' ? tone : null, !dot ? 'plain' : null, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}
