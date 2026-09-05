/** Et pengebeløp i øre. Alltid heltall — aldri kroner, aldri flyttall. */
export type Ore = number

/** Norske MVA-satser i prosent. */
export type VatRate = 0 | 12 | 15 | 25

/** En kurv- eller ordrelinje før beregning. `unitGross` er inkludert MVA. */
export type Line = {
  unitGross: Ore
  quantity: number
  vatRate: VatRate
}

/** Resultatet for én linje. `gross === net + vat` holder alltid. */
export type LineTotals = {
  gross: Ore
  vat: Ore
  net: Ore
}
