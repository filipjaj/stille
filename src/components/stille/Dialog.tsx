'use client'

import React from 'react'
import { createPortal } from 'react-dom'

import { Button } from './Button'
import { Icon } from './Icon'

type DialogVariant = 'default' | 'confirm'
type DialogTone = 'neutral' | 'destructive'

export type DialogProps = {
  open?: boolean
  onClose?: () => void
  title?: React.ReactNode
  image?: string
  imageAlt?: string
  /** confirm = kompakt 480px-panel med avbryt/bekreft-knapper. */
  variant?: DialogVariant
  /** destructive = bekreft-knappen fylles i feilrød. Kun relevant for variant="confirm". */
  tone?: DialogTone
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  loading?: boolean
  children?: React.ReactNode
  className?: string
}

/** Selektor for elementer fokusfellen skal kunne fange/gi fokus til. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal dialog — papirfarget panel over 60% kullsvart backdrop, med
 * omrisset lukkeknapp og Escape-lukking. `variant="confirm"` gir et
 * kompakt panel med avbryt/bekreft-knapper; `tone="destructive"` fyller
 * bekreft i feilrødt. Portert fra designprosjektets
 * _ref/components/disclosure/Dialog.jsx.
 *
 * Kilden rendrer rett i treet uten portal og uten fokusfelle utover å sette
 * initial fokus på panelet. Siden a11y er selve poenget med denne porten
 * legger vi til det som mangler for at komponenten skal være en reell modal:
 * `createPortal` til `document.body` (kun på klienten, se `mounted`) og en
 * Tab-fokusfelle som sirkulerer mellom panelets fokuserbare barn, pluss at
 * fokus gis tilbake til elementet som åpnet dialogen når den lukkes.
 */
export function Dialog({
  open = false,
  onClose,
  title,
  image,
  imageAlt = '',
  variant = 'default',
  tone = 'neutral',
  confirmLabel = 'Bekreft',
  cancelLabel = 'Avbryt',
  onConfirm,
  loading = false,
  children,
  className,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const previouslyFocused = React.useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = React.useState(false)

  // Portalen kan bare rendres etter at komponenten er montert på klienten.
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    panel?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  const confirm = variant === 'confirm'

  const classes = ['st-dialog-popup', confirm ? 'confirm' : null, className]
    .filter(Boolean)
    .join(' ')

  return createPortal(
    <>
      <div className="st-dialog-backdrop" onClick={onClose} />
      <div
        role={confirm ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="st-dialog-title"
        tabIndex={-1}
        ref={panelRef}
        className={classes}
      >
        <button type="button" className="st-dialog-close" aria-label="Lukk" onClick={onClose}>
          <Icon name="x" size={22} />
        </button>
        {image && !confirm ? <img src={image} alt={imageAlt} /> : null}
        {title ? <h2 id="st-dialog-title">{title}</h2> : null}
        {children}
        {confirm ? (
          <div className="st-dialog-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              className={tone === 'destructive' ? 'destructive' : undefined}
              icon={tone === 'destructive' ? 'trash' : 'arrow-right'}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </>,
    document.body,
  )
}
