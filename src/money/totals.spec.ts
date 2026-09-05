import { describe, expect, it } from 'vitest'
import { calculateTotals } from './totals'

const noShipping = { gross: 0, vatRate: 25 } as const

describe('calculateTotals', () => {
  it('ganger enhetspris med antall', () => {
    const totals = calculateTotals(
      [{ unitGross: 12500, quantity: 3, vatRate: 25 }],
      noShipping,
    )
    expect(totals.itemsGross).toBe(37500)
    expect(totals.lines[0]).toEqual({ gross: 37500, vat: 7500, net: 30000 })
  })

  it('holder gross = net + vat for hver linje', () => {
    const totals = calculateTotals(
      [{ unitGross: 3333, quantity: 7, vatRate: 15 }],
      noShipping,
    )
    const line = totals.lines[0]
    expect(line.net + line.vat).toBe(line.gross)
  })

  it('grupperer MVA per sats når kurven blander satser', () => {
    const totals = calculateTotals(
      [
        { unitGross: 12500, quantity: 1, vatRate: 25 },
        { unitGross: 11500, quantity: 1, vatRate: 15 },
        { unitGross: 20000, quantity: 1, vatRate: 0 },
      ],
      noShipping,
    )
    expect(totals.vatByRate).toEqual({ 25: 2500, 15: 1500, 0: 0 })
    expect(totals.totalVat).toBe(4000)
  })

  it('legger frakt til totalen med sin egen sats', () => {
    const totals = calculateTotals(
      [{ unitGross: 20000, quantity: 1, vatRate: 0 }],
      { gross: 12500, vatRate: 25 },
    )
    expect(totals.shippingGross).toBe(12500)
    expect(totals.grandTotalGross).toBe(32500)
    expect(totals.vatByRate).toEqual({ 0: 0, 25: 2500 })
  })

  it('utelater frakt fra MVA-grupperingen når frakten er gratis', () => {
    const totals = calculateTotals(
      [{ unitGross: 20000, quantity: 1, vatRate: 15 }],
      noShipping,
    )
    expect(totals.vatByRate).toEqual({ 15: 2609 })
  })

  it('summerer MVA fra linjer, ikke fra totalen', () => {
    // Tre linjer à 333 øre: per linje 333*25/125 = 66,6 -> 67. Sum 201.
    // Utledet fra totalen 999 hadde gitt 999*25/125 = 199,8 -> 200. Linjene vinner,
    // fordi det er de kunden ser summert i checkout.
    const totals = calculateTotals(
      [
        { unitGross: 333, quantity: 1, vatRate: 25 },
        { unitGross: 333, quantity: 1, vatRate: 25 },
        { unitGross: 333, quantity: 1, vatRate: 25 },
      ],
      noShipping,
    )
    expect(totals.totalVat).toBe(201)
  })

  it('gir nuller for en tom kurv', () => {
    const totals = calculateTotals([], noShipping)
    expect(totals).toEqual({
      lines: [],
      itemsGross: 0,
      shippingGross: 0,
      grandTotalGross: 0,
      vatByRate: {},
      totalVat: 0,
    })
  })
})
