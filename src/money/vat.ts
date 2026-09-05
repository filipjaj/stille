import type { Ore, VatRate } from './types'

const VAT_RATES: readonly VatRate[] = [0, 12, 15, 25]

/**
 * Runder halve bort fra null. `Math.round` runder halve mot pluss uendelig,
 * som gir feil fortegnsbehandling på kreditnota.
 */
const roundHalfAwayFromZero = (value: number): number =>
  Math.sign(value) * Math.round(Math.abs(value))

/**
 * Trekker MVA-andelen ut av en bruttopris. Bruttoprisen er den kunden ser,
 * og MVA-en ligger allerede inne i den.
 */
export function extractVat(gross: Ore, rate: VatRate): Ore {
  if (rate === 0) {
    return 0
  }
  return roundHalfAwayFromZero((gross * rate) / (100 + rate))
}

/**
 * Payload lagrer select-verdier som strenger. Konverterer og validerer mot
 * satsene som faktisk finnes i norsk rett.
 */
export function toVatRate(value: number | string): VatRate {
  const parsed = Number(value)
  const match = VAT_RATES.find((rate) => rate === parsed)
  if (match === undefined) {
    throw new Error(`Ugyldig MVA-sats: ${value}`)
  }
  return match
}
