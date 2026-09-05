import React from 'react'

export type AvatarProps = {
  /** Navnet initialene beregnes fra, og aria-label når det ikke er bilde. */
  name?: string
  /** Bilde-URL. Vises i stedet for initialer når satt. */
  src?: string
  /** Diameter i px. Skriftstørrelsen skaleres til 0,375 × size. Standard: 32. */
  size?: number
  className?: string
} & Omit<React.HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>

/**
 * Avatar — rund sandfarget skive med initialer (eller bilde). Det eneste
 * runde elementet utenom radioknapper. Portert fra designprosjektets
 * _ref/components/core/Avatar.jsx.
 */
export function Avatar({ name = '', src, size = 32, className, ...rest }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const classes = ['st-avatar', className].filter(Boolean).join(' ')

  return (
    <span
      className={classes}
      role="img"
      aria-label={name}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.375) }}
      {...rest}
    >
      {src ? <img src={src} alt="" /> : initials}
    </span>
  )
}
