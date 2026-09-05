'use client'

import React from 'react'

import { Icon, type IconName } from './Icon'

type CommonProps = {
  /** Synlig label over feltet. */
  label?: string
  /** Feilmelding — vises under feltet og setter aria-invalid; overstyrer hint. */
  error?: string
  /** Hjelpetekst under feltet, skjules når error er satt. */
  hint?: string
  /** Ikon i høyre kant av feltet. Vises kun for enkeltlinjefelt. */
  icon?: IconName
  /** Fjerner bunnmarg og strekker feltet i en flex-rad, f.eks. ved siden av en knapp. */
  inline?: boolean
  className?: string
}

type FieldAsInput = CommonProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof CommonProps> & {
    multiline?: false
  }

type FieldAsTextarea = CommonProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof CommonProps> & {
    /** Rendrer <textarea> i stedet for <input>. */
    multiline: true
  }

export type FieldProps = FieldAsInput | FieldAsTextarea

/**
 * TypeScript klarer ikke å smalne unionen på `props.multiline` alene, fordi
 * begge grenene er store intersection-typer. Denne vakten gjør det eksplisitt,
 * på samme måte som `isLink` i Button.tsx.
 */
const isTextarea = (props: FieldProps): props is FieldAsTextarea => props.multiline === true

const styleKeys = ['label', 'multiline', 'error', 'hint', 'icon', 'inline', 'className'] as const

/** Skiller designsystemets egne props fra dem som skal videre til DOM-noden. */
function splitProps<T extends FieldProps>(props: T): Omit<T, (typeof styleKeys)[number]> {
  const rest = { ...props }
  for (const key of styleKeys) {
    delete rest[key]
  }
  return rest
}

/**
 * Stille-felt — merket tekstinput eller tekstområde med feil/hint,
 * invalid- og disabled-tilstand. Portert fra designprosjektets
 * _ref/components/forms/Field.jsx.
 */
export function Field(props: FieldProps) {
  const { label, error, hint, icon, inline = false, className, id, style } = props
  const generatedId = React.useId()
  const fid = id || `st-field-${generatedId}`
  const errorId = `${fid}-err`

  let control: React.ReactNode

  if (isTextarea(props)) {
    control = (
      <textarea
        id={fid}
        className="st-input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...splitProps(props)}
      />
    )
  } else {
    const input = (
      <input
        id={fid}
        className="st-input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...splitProps(props)}
      />
    )
    control = icon ? (
      <div className="st-input-wrap">
        {input}
        <Icon name={icon} size={22} />
      </div>
    ) : (
      input
    )
  }

  return (
    <div
      className={['st-field', className].filter(Boolean).join(' ')}
      style={inline ? { margin: 0, flex: 1, ...style } : style}
    >
      {label && (
        <label className="st-field-label" htmlFor={fid}>
          {label}
        </label>
      )}
      {control}
      {error && (
        <span id={errorId} className="st-field-error">
          {error}
        </span>
      )}
      {!error && hint && <span className="st-field-hint">{hint}</span>}
    </div>
  )
}
