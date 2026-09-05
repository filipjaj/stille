'use client'

import React from 'react'

import { Icon } from './Icon'

type ToastOwnProps = {
  open?: boolean
  /** Kalles når toasten skal lukkes — både ved timeout og klikk på lukkeknappen. */
  onClose?: () => void
  /** Understreket handlingsknapp, for eksempel "Angre". */
  action?: React.ReactNode
  onAction?: () => void
  tone?: 'ink' | 'error'
  /** Ms før auto-lukk. 0 = sticky (lukkes ikke av seg selv). */
  duration?: number
  /** Fastspikret nederst i viewporten. false = inline i dokumentflyten. */
  fixed?: boolean
  className?: string
  children?: React.ReactNode
}

export type ToastProps = ToastOwnProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, keyof ToastOwnProps>

/**
 * Stille-toast — avvisbar melding i kullfarget felt, med valgfri understreket
 * handling. Auto-lukker etter `duration` ms med mindre `duration` er 0.
 * Portert fra designprosjektets _ref/components/core/Toast.jsx.
 *
 * Merk: bundelen definerer egne klasser (`st-toast-region`, `st-toast`,
 * `st-toast-action`, `st-toast-close`) via en CSS-in-JS-injeksjon
 * (`ensureToastStyles`) som denne porten ikke skal kjøre. `components.css`
 * har ingen av disse klassene — den har derimot `.st-status`/`.st-status.fixed`,
 * som tilhører designsystemets separate `Status`-komponent (samme visuelle
 * idé: kullfylt felt, `role="status"`). Vi gjenbruker `.st-status` her på
 * teamets instruks, men handlings- og lukkeknappen mangler dermed egne
 * klasser og får ingen layoutstyling (flex/gap) fra CSS-en som finnes i dag.
 */
export function Toast({
  children,
  open = true,
  onClose,
  action,
  onAction,
  tone = 'ink',
  duration = 5000,
  fixed = true,
  className,
  ...rest
}: ToastProps) {
  React.useEffect(() => {
    if (!open || !duration || !onClose) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [open, duration, onClose])

  if (!open) return null

  const classes = [
    'st-status',
    fixed ? 'fixed' : null,
    tone === 'error' ? 'error' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div role="status" aria-live="polite" className={classes} {...rest}>
      <span>{children}</span>
      {action ? (
        <button type="button" onClick={onAction}>
          {action}
        </button>
      ) : null}
      {onClose ? (
        <button type="button" aria-label="Lukk" onClick={onClose}>
          <Icon name="x" size={20} />
        </button>
      ) : null}
    </div>
  )
}
