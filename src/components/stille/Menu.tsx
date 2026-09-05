'use client'

import React from 'react'

import { Icon } from './Icon'

export type MenuItem = {
  /** Tegner en hårstrek i stedet for et valg når satt. */
  sep?: boolean
  label?: React.ReactNode
  hint?: React.ReactNode
  destructive?: boolean
  disabled?: boolean
  onSelect?: () => void
}

export type MenuProps = {
  items?: MenuItem[]
  /** Vises som tekst i utløseren i stedet for "···"-ikonet. */
  label?: React.ReactNode
  align?: 'left' | 'right'
  className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>

/**
 * Menu — nedtrekk med handlinger fra en "···"- eller merket utløser.
 * Elementer kan være destruktive (feil-ink); {sep:true} tegner en hårstrek.
 * Lukkes ved klikk utenfor eller Escape. Portert fra
 * designsystemets components/admin/Menu.jsx.
 */
export function Menu({ items = [], label, align = 'right', className, ...rest }: MenuProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', off)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', off)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  const classes = ['st-menu-wrap', className].filter(Boolean).join(' ')

  return (
    <div className={classes} ref={ref} {...rest}>
      <button
        type="button"
        className={['st-menu-trigger', label && 'labelled'].filter(Boolean).join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label ? undefined : 'Flere valg'}
        onClick={() => setOpen((o) => !o)}
      >
        {label ? (
          <>
            {label}
            <Icon name="caret-down" size={16} />
          </>
        ) : (
          <Icon name="dots-three" size={22} />
        )}
      </button>
      {open && (
        <ul
          role="menu"
          className={['st-menu', align === 'left' && 'left'].filter(Boolean).join(' ')}
        >
          {items.map((it, i) =>
            it.sep ? (
              <li key={i} role="separator" className="st-menu-sep" />
            ) : (
              <li key={i} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={['st-menu-item', it.destructive && 'destructive']
                    .filter(Boolean)
                    .join(' ')}
                  disabled={it.disabled}
                  onClick={() => {
                    setOpen(false)
                    it.onSelect && it.onSelect()
                  }}
                >
                  <span>{it.label}</span>
                  {it.hint && <small>{it.hint}</small>}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}
