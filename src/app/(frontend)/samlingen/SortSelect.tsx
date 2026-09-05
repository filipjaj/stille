'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import { Select } from '@/components/stille/Select'

const SORT_ITEMS = [
  { value: 'new', label: 'Nyeste' },
  { value: 'low', label: 'Pris, lav–høy' },
  { value: 'high', label: 'Pris, høy–lav' },
]

/**
 * Sorteringsvelgeren i samlingen. Skriver valget til `?sortering=` i URL-en
 * i stedet for lokal state, slik at filteret (kategori-fanene) og
 * sorteringen kan leve i samme lenke og overleve en reload.
 */
export function SortSelect({ value }: { value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onValueChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'new') {
      params.delete('sortering')
    } else {
      params.set('sortering', next)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return <Select inline items={SORT_ITEMS} value={value} onValueChange={onValueChange} />
}
