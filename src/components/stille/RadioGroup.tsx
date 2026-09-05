'use client'

import React from 'react'

export type RadioGroupItem = {
  value: string
  label: React.ReactNode
  disabled?: boolean
  /** Innhold plassert til høyre, f.eks. en pris. */
  trail?: React.ReactNode
}

export type RadioGroupProps = {
  items?: RadioGroupItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  /** Rammet variant med luft rundt og trail dyttet til høyre. */
  boxed?: boolean
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * Radioknapp-gruppe — tynn sirkulær kant, blekkfylt med papirprikk når
 * valgt. Piltaster (opp/venstre, ned/høyre) flytter valget syklisk.
 * Portert fra designprosjektets _ref/components/forms/RadioGroup.jsx.
 */
export function RadioGroup({
  items = [],
  value,
  defaultValue,
  onValueChange,
  name,
  boxed = false,
  disabled = false,
  className,
  style,
}: RadioGroupProps) {
  const [inner, setInner] = React.useState(defaultValue ?? items[0]?.value)
  const val = value !== undefined ? value : inner

  const pick = (v: string | undefined) => {
    if (disabled || v === undefined) return
    setInner(v)
    onValueChange?.(v)
  }

  return (
    <div
      role="radiogroup"
      className={['st-radio-group', className].filter(Boolean).join(' ')}
      style={style}
    >
      {items.map((item) => {
        const on = item.value === val
        const isDisabled = disabled || item.disabled

        return (
          <label
            key={item.value}
            className={['st-radio-label', boxed ? 'boxed' : null].filter(Boolean).join(' ')}
            style={isDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
          >
            <button
              type="button"
              role="radio"
              name={name}
              className="st-radio"
              aria-checked={on}
              disabled={isDisabled}
              onClick={() => pick(item.value)}
              onKeyDown={(e) => {
                const i = items.findIndex((x) => x.value === val)
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  pick(items[(i + 1) % items.length]?.value)
                }
                if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  pick(items[(i - 1 + items.length) % items.length]?.value)
                }
              }}
            >
              {on && <span className="st-radio-dot" />}
            </button>
            <span>{item.label}</span>
            {item.trail !== undefined && <span className="st-trail">{item.trail}</span>}
          </label>
        )
      })}
    </div>
  )
}
