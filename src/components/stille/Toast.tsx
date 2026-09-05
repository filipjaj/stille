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
 * Klassene ligger i components.css. De lå opprinnelig som CSS-in-JS i
 * bundelen og er hentet ut derfra — Toast deler ikke klasser med `Status`,
 * selv om de to ser like ut.
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

  const regionClasses = ['st-toast-region', fixed ? null : 'inline'].filter(Boolean).join(' ')
  const toastClasses = ['st-toast', tone === 'error' ? 'error' : null, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={regionClasses}>
      <div role="status" aria-live="polite" className={toastClasses} {...rest}>
        <span>{children}</span>
        {action ? (
          <button type="button" className="st-toast-action" onClick={onAction}>
            {action}
          </button>
        ) : null}
        {onClose ? (
          <button type="button" className="st-toast-close" aria-label="Lukk" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
