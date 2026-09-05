import type { Line, LineTotals, Ore, VatRate } from './types'
import { extractVat } from './vat'

export type Shipping = {
  gross: Ore
  vatRate: VatRate
}

export type Totals = {
  lines: LineTotals[]
  itemsGross: Ore
  shippingGross: Ore
  grandTotalGross: Ore
  vatByRate: Partial<Record<VatRate, Ore>>
  totalVat: Ore
}

const lineTotals = (line: Line): LineTotals => {
  const gross = line.unitGross * line.quantity
  const vat = extractVat(gross, line.vatRate)
  return { gross, vat, net: gross - vat }
}

/**
 * Beregner ordretotalen. MVA utledes per linje og summeres deretter — aldri
 * utledet fra totalsummen, som ville gitt avvik mot linjene kunden ser.
 */
export function calculateTotals(lines: Line[], shipping: Shipping): Totals {
  const computed = lines.map(lineTotals)
  const vatByRate: Partial<Record<VatRate, Ore>> = {}

  lines.forEach((line, index) => {
    vatByRate[line.vatRate] = (vatByRate[line.vatRate] ?? 0) + computed[index].vat
  })

  if (shipping.gross !== 0) {
    const shippingVat = extractVat(shipping.gross, shipping.vatRate)
    vatByRate[shipping.vatRate] = (vatByRate[shipping.vatRate] ?? 0) + shippingVat
  }

  const itemsGross = computed.reduce((sum, line) => sum + line.gross, 0)
  // Object.values på en Partial gir (Ore | undefined)[], derfor ?? 0.
  const totalVat = Object.values(vatByRate).reduce<Ore>((sum, vat) => sum + (vat ?? 0), 0)

  return {
    lines: computed,
    itemsGross,
    shippingGross: shipping.gross,
    grandTotalGross: itemsGross + shipping.gross,
    vatByRate,
    totalVat,
  }
}
