'use client'

import React from 'react'

export type SwitchProps = {
  label?: React.ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'role' | 'className' | 'onClick' | 'children'
>

/**
 * Bryter — 40×22px firkantet toggle, blekkfylt når på. Bruk til
 * umiddelbare innstillinger; bruk Checkbox til samtykke i skjema.
 * Portert fra designprosjektets _ref/components/forms/Switch.jsx.
 */
export function Switch({
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className,
  ...rest
}: SwitchProps) {
  const [inner, setInner] = React.useState(defaultChecked)
  const val = checked !== undefined ? checked : inner

  const toggle = () => {
    if (disabled) return
    setInner(!val)
    onCheckedChange?.(!val)
  }

  return (
    <label
      className={['st-switch-label', className].filter(Boolean).join(' ')}
      style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
    >
      <button
        type="button"
        role="switch"
        className="st-switch"
        aria-checked={val}
        disabled={disabled}
        onClick={toggle}
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  )
}
