'use client'

import React from 'react'

/** Én fane: synlig etikett og valgfritt panelinnhold. En streng rendres som ett avsnitt. */
export type TabItem = {
  label: string
  content?: React.ReactNode
}

export type TabsProps = {
  items?: TabItem[]
  /** Ustyrt startvalg. Ignoreres når `index` er satt (styrt modus). */
  defaultIndex?: number
  /** Styrt gjeldende indeks. Krever `onChange` for å faktisk endre fane. */
  index?: number
  onChange?: (index: number) => void
  /** Serif-variant med større skrift — brukes på produktdetaljer. */
  serif?: boolean
  className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>

/**
 * Faner — understreket fanerekke på en hårfin linje; gjeldende fane i blekk.
 * Piltastene flytter fokus mellom faner, Home/End hopper til første/siste.
 * Portert fra designprosjektets _ref/components/navigation/Tabs.jsx.
 */
export function Tabs({
  items = [],
  defaultIndex = 0,
  index,
  onChange,
  serif = false,
  className,
  ...rest
}: TabsProps) {
  const [inner, setInner] = React.useState(defaultIndex)
  const cur = index ?? inner
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  const select = (i: number) => {
    setInner(i)
    onChange && onChange(i)
  }

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n =
      e.key === 'ArrowRight'
        ? (i + 1) % items.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + items.length) % items.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? items.length - 1
              : null
    if (n === null) return
    e.preventDefault()
    select(n)
    refs.current[n]?.focus()
  }

  const it = items[cur]
  const classes = ['st-tabs', serif && 'serif', className].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      <div role="tablist" className="st-tablist">
        {items.map((t, i) => (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={'st-tab-' + i}
            aria-selected={i === cur}
            aria-controls={'st-panel-' + i}
            tabIndex={i === cur ? 0 : -1}
            className="st-tab"
            onClick={() => select(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {it && it.content != null && (
        <div
          role="tabpanel"
          id={'st-panel-' + cur}
          aria-labelledby={'st-tab-' + cur}
          className="st-tabpanel"
        >
          {typeof it.content === 'string' ? <p>{it.content}</p> : it.content}
        </div>
      )}
    </div>
  )
}
