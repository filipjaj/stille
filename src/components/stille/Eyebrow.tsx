import React from 'react'

export type EyebrowProps<T extends React.ElementType = 'span'> = {
  /** HTML-tag eller komponent å rendre som. Standard: span. */
  as?: T
  className?: string
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

/**
 * Eyebrow — 12px stor bokstav-etikett plassert over overskrifter:
 * «Samling / 01», «Journal / Rom». Portert fra designprosjektets
 * _ref/components/core/Eyebrow.jsx.
 */
export function Eyebrow<T extends React.ElementType = 'span'>({
  as,
  className,
  children,
  ...rest
}: EyebrowProps<T>) {
  const Tag = (as || 'span') as React.ElementType
  const classes = ['st-eyebrow', className].filter(Boolean).join(' ')

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  )
}
