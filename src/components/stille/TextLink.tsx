import React from 'react'

import { Icon, type IconName } from './Icon'

type CommonProps = {
  /** Etterstilt ikon, for eksempel "arrow-right". */
  icon?: IconName
  /** plain = uten understrek-linje og med mindre mellomrom. */
  plain?: boolean
  className?: string
  children?: React.ReactNode
}

type TextLinkAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined
  }

type TextLinkAsAnchor = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    /** Rendrer som <a href>. */
    href: string
  }

export type TextLinkProps = TextLinkAsButton | TextLinkAsAnchor

/**
 * TypeScript klarer ikke å smalne unionen på `props.href` alene, fordi begge
 * grenene er store intersection-typer. Denne vakten gjør det eksplisitt.
 */
const isAnchor = (props: TextLinkProps): props is TextLinkAsAnchor => props.href !== undefined

const styleKeys = ['icon', 'plain', 'className', 'children'] as const

/** Skiller designsystemets egne props fra dem som skal videre til DOM-noden. */
function splitProps<T extends TextLinkProps>(props: T): Omit<T, (typeof styleKeys)[number]> {
  const rest = { ...props }
  for (const key of styleKeys) {
    delete rest[key]
  }
  return rest
}

/**
 * TextLink — understreket tekst-handling: en 14px lenke eller knapp med
 * ink-linje under og valgfritt etterstilt ikon. Portert fra
 * designprosjektets _ref/components/core/TextLink.jsx.
 */
export function TextLink(props: TextLinkProps) {
  const { icon, plain = false, className, children } = props

  const classes = ['st-text-link', plain ? 'plain' : null, className].filter(Boolean).join(' ')

  const trailing = icon ? (
    <Icon
      name={icon}
      size={icon === 'arrow-right' ? 24 : 22}
      weight={icon === 'arrow-right' ? 'thin' : 'light'}
    />
  ) : null

  if (isAnchor(props)) {
    return (
      <a className={classes} {...splitProps(props)}>
        <span>{children}</span>
        {trailing}
      </a>
    )
  }

  const { href: _href, type = 'button', ...buttonProps } = splitProps(props)

  return (
    <button className={classes} type={type} {...buttonProps}>
      <span>{children}</span>
      {trailing}
    </button>
  )
}
