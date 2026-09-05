import type { Ore } from '@/money'

/**
 * Formaterer et beløp i øre slik Stille skriver priser: «1 530,–».
 *
 * Tynt mellomrom fra `toLocaleString` byttes ut med vanlig mellomrom, slik
 * designet gjør — ellers brekker tallet annerledes enn i prototypen.
 */
export function formatOre(ore: Ore): string {
  return (ore / 100).toLocaleString('nb-NO').replace(/ /g, ' ') + ',–'
}

/** «Fri» i stedet for «0,–», som designet viser for gratis frakt. */
export function formatShipping(ore: Ore): string {
  return ore === 0 ? 'Fri' : formatOre(ore)
}
