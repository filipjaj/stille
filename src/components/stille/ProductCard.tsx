'use client'

import React, { useState } from 'react'

import { Icon } from './Icon'
import { TextLink } from './TextLink'

export type ProductCardProps = {
  /** Bildeadresse. */
  image: string
  /** Alt-tekst for bildet. */
  alt?: string
  /** Produkttittel. */
  title: React.ReactNode
  /** Kategori-etikett. */
  category: React.ReactNode
  /** Pris, formatert som streng. */
  price: React.ReactNode
  /** Lenke til produktdetaljer. */
  href?: string
  /** Kalles når brukeren klikker "Legg i kurven". */
  onAdd?: () => void
  /** Vis "Legg i kurven"-lenken selv om onAdd ikke er satt. */
  showAdd?: boolean
  /** Tekst for "Legg i kurven"-lenken. */
  addLabel?: string
  /** Tillat lagring (hjerte-ikonknapp). */
  saveable?: boolean
  /** Lagringsstatus — hvis satt, overstyr intern state. */
  saved?: boolean
  /** Kalles når lagringsstatus endres. */
  onSaveChange?: (saved: boolean) => void
  className?: string
  style?: React.CSSProperties
}

/**
 * Produktkort — 4:5-bilde, serif-tittel, kategori + pristabell, "Legg i kurven"-tekstlenke,
 * valgfritt lagringshjerte. Portert fra designsystemet.
 */
export function ProductCard({
  image,
  alt = '',
  title,
  category,
  price,
  href = '#',
  onAdd,
  showAdd = false,
  addLabel = 'Legg i kurven',
  saveable = false,
  saved,
  onSaveChange,
  className,
  style,
}: ProductCardProps) {
  const [inner, setInner] = useState(false)
  const isSaved = saved !== undefined ? saved : inner

  return (
    <article className={['st-product', className].filter(Boolean).join(' ')} style={style}>
      <a href={href}>
        <img src={image} alt={alt} />
        <h3>{title}</h3>
      </a>
      {saveable && (
        <button
          type="button"
          className="st-save"
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Fjern fra lagrede' : 'Lagre'}
          onClick={() => {
            setInner(!isSaved)
            onSaveChange?.(!isSaved)
          }}
        >
          <Icon name="heart" size={24} />
        </button>
      )}
      <p className="st-product-meta">
        <span>{category}</span>
        <span>{price}</span>
      </p>
      {(onAdd || showAdd) && (
        <TextLink icon="plus" onClick={onAdd}>
          {addLabel}
        </TextLink>
      )}
    </article>
  )
}
