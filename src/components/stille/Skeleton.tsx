import React from 'react'

export type SkeletonProps = {
  /** Bredde. Tall tolkes som px. Standard: '100%'. */
  width?: number | string
  /** Høyde. Tall tolkes som px. Standard: 16. */
  height?: number | string
  /** Antall linjer. >1 rendrer en tekst-stack der siste linje er kortere. Standard: 1. */
  lines?: number
  className?: string
} & Omit<React.HTMLAttributes<HTMLElement>, 'className'>

/**
 * Skeleton — skimrende overflate-/sandblokk. lines>1 rendrer en tekst-stack
 * med en kortere siste linje. Portert fra designprosjektets
 * _ref/components/core/Skeleton.jsx.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  lines = 1,
  className,
  ...rest
}: SkeletonProps) {
  if (lines > 1) {
    const classes = ['st-skeleton-lines', className].filter(Boolean).join(' ')

    return (
      <div className={classes} aria-hidden="true" {...rest}>
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className="st-skeleton"
            style={{ width: index === lines - 1 ? '60%' : width, height }}
          />
        ))}
      </div>
    )
  }

  const classes = ['st-skeleton', className].filter(Boolean).join(' ')

  return <span className={classes} aria-hidden="true" style={{ width, height }} {...rest} />
}
