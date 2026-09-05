'use client'

import React from 'react'

import { Icon } from './Icon'

export type CheckboxProps = {
  label?: React.ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  /** Rammet variant med luft rundt og trail dyttet til høyre. */
  boxed?: boolean
  /** Innhold plassert til høyre, f.eks. en pris. */
  trail?: React.ReactNode
  className?: string
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'role' | 'className' | 'onClick' | 'children'
>

/**
 * Firkantet 22px avkrysningsboks med blekkfylt sjekket tilstand og et
 * Light check-ikon. Portert fra designprosjektets
 * _ref/components/forms/Checkbox.jsx.
 */
export function Checkbox({
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  boxed = false,
  trail,
  className,
  ...rest
}: CheckboxProps) {
  const [inner, setInner] = React.useState(defaultChecked)
  const val = checked !== undefined ? checked : inner

  const toggle = () => {
    if (disabled) return
    setInner(!val)
    onCheckedChange?.(!val)
  }

  return (
    <label
      className={['st-check-label', boxed ? 'boxed' : null, className].filter(Boolean).join(' ')}
      style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
    >
      <button
        type="button"
        role="checkbox"
        className="st-checkbox"
        aria-checked={val}
        disabled={disabled}
        onClick={toggle}
        {...rest}
      >
        {val && <Icon name="check" size={18} />}
      </button>
      <span>{label}</span>
      {trail && <span className="st-trail">{trail}</span>}
    </label>
  )
}
