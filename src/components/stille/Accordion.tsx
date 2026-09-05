'use client'

import React from 'react'

import { Icon } from './Icon'

export type AccordionItem = {
  title: React.ReactNode
  /** Streng rendres i et <p>; alt annet rendres som gitt. */
  content: React.ReactNode
}

export type AccordionProps = {
  items?: AccordionItem[]
  /** true = flere paneler kan stå åpne samtidig. Default: kun ett om gangen. */
  multiple?: boolean
  /** Indekser i `items` som skal starte åpne. */
  defaultOpen?: number[]
  className?: string
}

/**
 * Stille-accordion — serif 24px-triggere med hårfine skillelinjer, og et
 * Phosphor-plusstegn som roterer til et kryss når panelet er åpent.
 * Portert fra designprosjektets _ref/components/disclosure/Accordion.jsx.
 */
export function Accordion({
  items = [],
  multiple = false,
  defaultOpen = [],
  className,
}: AccordionProps) {
  const [open, setOpen] = React.useState<Set<number>>(() => new Set(defaultOpen))

  const toggle = (index: number) => {
    setOpen((prev) => {
      const next = new Set<number>(multiple ? prev : [])
      if (prev.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const classes = ['st-disclosures', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {items.map((item, index) => {
        const isOpen = open.has(index)
        const panelId = `st-acc-${index}`

        return (
          <div className="st-disclosure" key={index}>
            <h3>
              <button
                type="button"
                className="st-disclosure-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span>{item.title}</span>
                <Icon name="plus" size={24} />
              </button>
            </h3>
            {isOpen ? (
              <div id={panelId} className="st-disclosure-panel">
                {typeof item.content === 'string' ? <p>{item.content}</p> : item.content}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
