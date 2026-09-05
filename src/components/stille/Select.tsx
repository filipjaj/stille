'use client'

import React from 'react'

import { Icon } from './Icon'

export type SelectItem = {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export type SelectProps = {
  /** Synlig label over feltet. */
  label?: string
  items?: SelectItem[]
  /** Styrt verdi. Uten denne styrer komponenten seg selv via defaultValue. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Feilmelding — vises under feltet og setter aria-invalid. */
  error?: string
  /** Fjerner bunnmarg og strekker feltet i en flex-rad. */
  inline?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Egendefinert select — papir-popup, blekk-highlight, Phosphor-caret og
 * -check, full tastaturnavigasjon (piltaster, Enter/mellomrom, Escape og
 * bokstav-søk). Portert fra designprosjektets _ref/components/forms/Select.jsx.
 */
export function Select({
  label,
  items = [],
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Velg',
  disabled = false,
  error,
  inline = false,
  id,
  className,
  style,
}: SelectProps) {
  const generatedId = React.useId()
  const sid = id || `st-select-${generatedId}`
  const [open, setOpen] = React.useState(false)
  const [inner, setInner] = React.useState(defaultValue ?? items[0]?.value)
  const val = value !== undefined ? value : inner
  const idx = Math.max(
    0,
    items.findIndex((item) => item.value === val),
  )
  const [highlighted, setHighlighted] = React.useState(idx)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  const commit = (v: string) => {
    setInner(v)
    onValueChange?.(v)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      setHighlighted((h) => Math.min(items.length - 1, h + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(0, h - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) {
        commit(items[highlighted].value)
      } else {
        setHighlighted(idx)
        setOpen(true)
      }
    } else if (e.key.length === 1) {
      const k = e.key.toLowerCase()
      const found = items.findIndex((item) => String(item.label).toLowerCase().startsWith(k))
      if (found >= 0) {
        setHighlighted(found)
        if (!open) commit(items[found].value)
      }
    }
  }

  const current = items.find((item) => item.value === val)

  return (
    <div
      className={['st-field', className].filter(Boolean).join(' ')}
      style={inline ? { margin: 0, flex: 1, ...style } : style}
      ref={ref}
    >
      {label && (
        <label className="st-field-label" htmlFor={sid}>
          {label}
        </label>
      )}
      <div className="st-select-wrap">
        <button
          id={sid}
          type="button"
          className="st-select"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={error ? 'true' : undefined}
          disabled={disabled}
          onClick={() => {
            setHighlighted(idx)
            setOpen((o) => !o)
          }}
          onKeyDown={onKeyDown}
        >
          <span style={{ color: current ? undefined : 'var(--st-muted)' }}>
            {current ? current.label : placeholder}
          </span>
          <Icon name="caret-down" size={22} />
        </button>
        {open && (
          <ul className="st-select-popup" role="listbox" aria-labelledby={sid}>
            {items.map((item, i) => (
              <li
                key={item.value}
                role="option"
                aria-selected={item.value === val}
                aria-disabled={item.disabled || undefined}
                data-highlighted={i === highlighted}
                className="st-select-option"
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => !item.disabled && commit(item.value)}
              >
                <span>{item.label}</span>
                {item.value === val && <Icon name="check" size={22} />}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <span className="st-field-error">{error}</span>}
    </div>
  )
}
