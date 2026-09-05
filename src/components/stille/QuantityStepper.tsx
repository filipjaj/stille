'use client'

import React from 'react'

import { Icon } from './Icon'

export type QuantityStepperProps = {
  /** Gjeldende mengde (1–99). */
  value?: number
  /** Minimum mengde. */
  min?: number
  /** Maksimum mengde. */
  max?: number
  /** Kalles når mengden endres. */
  onChange?: (value: number) => void
  /** aria-label for gruppen. */
  label?: string
  className?: string
}

/**
 * Mengdevelger — 40px omrisset minus/pluss-knapper rundt et tall (handlekurvlinjer, 1–99).
 * Portert fra designsystemet.
 */
export function QuantityStepper({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  label = 'Antall',
  className,
}: QuantityStepperProps) {
  return (
    <div
      className={['st-quantity', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label="Reduser"
        disabled={value <= min}
        onClick={() => onChange?.(value - 1)}
      >
        <Icon name="minus" size={22} />
      </button>
      <span
        aria-live="polite"
        style={{
          minWidth: 24,
          textAlign: 'center',
        }}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Øk"
        disabled={value >= max}
        onClick={() => onChange?.(value + 1)}
      >
        <Icon name="plus" size={22} />
      </button>
    </div>
  )
}
