import React from 'react'

import { Icon, type IconName } from './Icon'

type CommonProps = {
  /** primary = kullfylt; secondary = gjennomsiktig med blekkramme. */
  variant?: 'primary' | 'secondary'
  /** compact = 8px 12px padding (produktkort). */
  size?: 'default' | 'compact'
  fullWidth?: boolean
  /** Viser en roterende spinner-gap og deaktiverer knappen. */
  loading?: boolean
  disabled?: boolean
  /** Etterstilt ikon, for eksempel "arrow-right". */
  icon?: IconName
  className?: string
  children?: React.ReactNode
}

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined
  }

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    /** Rendrer som <a href>. */
    href: string
  }

export type ButtonProps = ButtonAsButton | ButtonAsLink

/**
 * TypeScript klarer ikke å smalne unionen på `props.href` alene, fordi begge
 * grenene er store intersection-typer. Denne vakten gjør det eksplisitt.
 */
const isLink = (props: ButtonProps): props is ButtonAsLink => props.href !== undefined

const styleKeys = [
  'variant',
  'size',
  'fullWidth',
  'loading',
  'disabled',
  'icon',
  'className',
  'children',
] as const

/** Skiller designsystemets egne props fra dem som skal videre til DOM-noden. */
function splitProps<T extends ButtonProps>(props: T): Omit<T, (typeof styleKeys)[number]> {
  const rest = { ...props }
  for (const key of styleKeys) {
    delete rest[key]
  }
  return rest
}

/**
 * Stille-knapp — kullfylt primær eller omrisset sekundær, etterstilt ikon,
 * lasting og deaktivert. Portert fra designprosjektets
 * _ref/components/core/Button.jsx.
 *
 * Lenkevarianten rendrer en vanlig <a>, ikke next/link: komponenten brukes
 * også til eksterne mål, og designsystemet skal ikke være bundet til Next.
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'default',
    fullWidth = false,
    loading = false,
    disabled = false,
    icon,
    className,
    children,
  } = props

  const classes = [
    'st-button',
    variant === 'secondary' ? 'secondary' : null,
    size === 'compact' ? 'compact' : null,
    fullWidth ? 'full' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const trailing = loading ? (
    <Icon name="spinner-gap" size={24} spin />
  ) : icon ? (
    <Icon name={icon} size={24} />
  ) : null

  if (isLink(props)) {
    return (
      <a
        className={classes}
        aria-disabled={disabled || undefined}
        aria-busy={loading || undefined}
        {...splitProps(props)}
      >
        <span>{children}</span>
        {trailing}
      </a>
    )
  }

  const { href: _href, type = 'button', ...buttonProps } = splitProps(props)

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...buttonProps}
    >
      <span>{children}</span>
      {trailing}
    </button>
  )
}
