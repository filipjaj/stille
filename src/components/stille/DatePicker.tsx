'use client'

import React from 'react'

import { Icon } from './Icon'

const MONTHS = [
  'januar',
  'februar',
  'mars',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'desember',
]
const DAYS = ['ma', 'ti', 'on', 'to', 'fr', 'lø', 'sø']

const format = (d: Date | null) =>
  d ? `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : ''
const isSameDay = (a: Date | null, b: Date | null) =>
  !!a &&
  !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export type DatePickerProps = {
  label?: string
  value?: Date | string | number | null
  defaultValue?: Date | string | number | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  /** Fjerner bunnmarg — for plassering ved siden av andre felt. */
  inline?: boolean
  className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

/**
 * Datovelger — felt-stilt utløser som åpner et 7-kolonners månedsgrid.
 * Valgt dag fylles med blekk, dagens dato understrekes. Lukkes ved klikk
 * utenfor eller Escape. Portert fra designprosjektets
 * _ref/components/forms/DatePicker.jsx.
 */
export function DatePicker({
  label,
  value,
  defaultValue = null,
  onChange,
  placeholder = 'Velg dato',
  disabled = false,
  inline = false,
  className,
  ...rest
}: DatePickerProps) {
  const [inner, setInner] = React.useState<Date | null>(
    defaultValue ? new Date(defaultValue) : null,
  )
  const val = value !== undefined ? (value ? new Date(value) : null) : inner
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState(() => {
    const d = val || new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (d: Date | null) => {
    setInner(d)
    onChange?.(d)
    setOpen(false)
  }

  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const lead = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(1 - lead)
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
  const today = new Date()
  const generatedId = React.useId()
  const id = `st-datepicker-${generatedId}`

  return (
    <div
      className={['st-field', 'st-datepicker', className].filter(Boolean).join(' ')}
      ref={ref}
      style={inline ? { marginBottom: 0 } : undefined}
      {...rest}
    >
      {label && (
        <label className="st-field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        className="st-select"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={val ? undefined : { color: 'var(--st-muted)' }}>
          {val ? format(val) : placeholder}
        </span>
        <Icon name="calendar-blank" size={18} />
      </button>
      {open && (
        <div role="dialog" aria-label="Kalender" className="st-calendar">
          <div className="st-cal-head">
            <button
              type="button"
              className="st-cal-nav"
              aria-label="Forrige måned"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            >
              <Icon name="arrow-left" size={16} weight="thin" />
            </button>
            <b>
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </b>
            <button
              type="button"
              className="st-cal-nav"
              aria-label="Neste måned"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            >
              <Icon name="arrow-right" size={16} weight="thin" />
            </button>
          </div>
          <div className="st-cal-grid">
            {DAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
            {cells.map((d, i) => (
              <button
                key={i}
                type="button"
                className={[
                  'st-cal-day',
                  d.getMonth() !== view.getMonth() ? 'other' : null,
                  isSameDay(d, today) ? 'today' : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-selected={isSameDay(d, val) || undefined}
                aria-label={format(d)}
                onClick={() => pick(d)}
              >
                {d.getDate()}
              </button>
            ))}
          </div>
          <div className="st-cal-foot">
            <button
              type="button"
              onClick={() => pick(new Date(today.getFullYear(), today.getMonth(), today.getDate()))}
            >
              I dag
            </button>
            {val && (
              <button type="button" onClick={() => pick(null)}>
                Fjern
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
