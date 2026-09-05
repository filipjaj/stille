'use client'

import React from 'react'

import { Checkbox } from './Checkbox'
import { Icon } from './Icon'

/** Nøkkelen en rad identifiseres med i valg og sortering. */
export type RowKeyValue = string | number

export type SortState = {
  key: string
  dir: 'asc' | 'desc'
}

export type TableColumn<T> = {
  key: string
  label: React.ReactNode
  align?: 'left' | 'right'
  /** Dempet (grå) tekstfarge for cellene i denne kolonnen. */
  muted?: boolean
  sortable?: boolean
  /** Verdien sorteringen skal sammenligne på, når den avviker fra `row[key]`. */
  sortValue?: (row: T) => string | number
  render?: (row: T) => React.ReactNode
  width?: number | string
}

export type TableProps<T> = {
  columns?: TableColumn<T>[]
  rows?: T[]
  /** Feltnavn eller funksjon som gir radens unike nøkkel. Default: `id`. */
  rowKey?: keyof T | ((row: T) => RowKeyValue)
  selectable?: boolean
  /** Kontrollert utvalg. Uten denne holder komponenten egen intern state. */
  selected?: RowKeyValue[]
  onSelectedChange?: (selected: RowKeyValue[]) => void
  onRowClick?: (row: T) => void
  /** Kontrollert sortering. Uten denne holder komponenten egen intern state. */
  sort?: SortState | null
  onSortChange?: (sort: SortState | null) => void
  empty?: React.ReactNode
  caption?: React.ReactNode
  className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>

/**
 * Data-tabell — hårstrek-rader, uppercase kolonneetiketter, valgfri
 * sortering, radvalg og radklikk. Generisk over radtypen `T` slik at
 * `render`/`sortValue` får riktig type på raden. Portert fra
 * designsystemets components/admin/Table.jsx.
 */
export function Table<T>({
  columns = [],
  rows = [],
  rowKey = 'id' as keyof T,
  selectable = false,
  selected,
  onSelectedChange,
  onRowClick,
  sort,
  onSortChange,
  empty = 'Ingen rader.',
  caption,
  className,
  ...rest
}: TableProps<T>) {
  const [innerSel, setInnerSel] = React.useState<Set<RowKeyValue>>(() => new Set())
  const [innerSort, setInnerSort] = React.useState<SortState | null>(null)

  const sel = selected ? new Set(selected) : innerSel
  const srt = sort ?? innerSort

  const setSel = (s: Set<RowKeyValue>) => {
    setInnerSel(s)
    onSelectedChange && onSelectedChange([...s])
  }

  const setSort = (s: SortState | null) => {
    setInnerSort(s)
    onSortChange && onSortChange(s)
  }

  const keyOf = (r: T): RowKeyValue =>
    typeof rowKey === 'function'
      ? (rowKey as (row: T) => RowKeyValue)(r)
      : (r[rowKey as keyof T] as RowKeyValue)

  const sorted = React.useMemo(() => {
    if (!srt) return rows
    const col = columns.find((c) => c.key === srt.key)
    const get = (r: T) =>
      col && col.sortValue ? col.sortValue(r) : (r as Record<string, unknown>)[srt.key]
    return [...rows].sort((a, b) => {
      const x = get(a)
      const y = get(b)
      const c =
        typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x ?? '').localeCompare(String(y ?? ''), 'nb')
      return srt.dir === 'desc' ? -c : c
    })
  }, [rows, srt, columns])

  const allOn = rows.length > 0 && rows.every((r) => sel.has(keyOf(r)))
  const toggleAll = () => setSel(allOn ? new Set() : new Set(rows.map(keyOf)))
  const toggleOne = (k: RowKeyValue) => {
    const n = new Set(sel)
    n.has(k) ? n.delete(k) : n.add(k)
    setSel(n)
  }

  const clickSort = (c: TableColumn<T>) => {
    if (!c.sortable) return
    setSort(
      srt && srt.key === c.key
        ? srt.dir === 'asc'
          ? { key: c.key, dir: 'desc' }
          : null
        : { key: c.key, dir: 'asc' },
    )
  }

  const classes = ['st-table-wrap', className].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      <table className="st-table">
        {caption && (
          <caption style={{ position: 'absolute', clip: 'rect(0 0 0 0)' }}>{caption}</caption>
        )}
        <thead>
          <tr>
            {selectable && (
              <th className="sel" scope="col">
                <Checkbox aria-label="Velg alle" checked={allOn} onCheckedChange={toggleAll} />
              </th>
            )}
            {columns.map((c) => {
              const on = srt && srt.key === c.key
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={c.align === 'right' ? 'num' : undefined}
                  style={c.width ? { width: c.width } : undefined}
                  aria-sort={on ? (srt!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {c.sortable ? (
                    <button type="button" onClick={() => clickSort(c)}>
                      {c.label}
                      <Icon name="caret-down" size={14} />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const k = keyOf(r)
            return (
              <tr
                key={k}
                className={onRowClick ? 'clickable' : undefined}
                aria-selected={selectable ? sel.has(k) : undefined}
                onClick={
                  onRowClick
                    ? (e) => {
                        if ((e.target as HTMLElement).closest('button,a,input,label')) return
                        onRowClick(r)
                      }
                    : undefined
                }
              >
                {selectable && (
                  <td className="sel">
                    <Checkbox
                      aria-label="Velg rad"
                      checked={sel.has(k)}
                      onCheckedChange={() => toggleOne(k)}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={
                      [c.align === 'right' && 'num', c.muted && 'muted']
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                  >
                    {c.render
                      ? c.render(r)
                      : ((r as Record<string, unknown>)[c.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && <div className="st-table-empty">{empty}</div>}
    </div>
  )
}
