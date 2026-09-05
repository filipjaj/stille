import type { Media } from '@/payload-types'

/**
 * Henter URL-en ut av et mediefelt.
 *
 * Payload gir enten et tall (udypet relasjon) eller hele dokumentet, avhengig
 * av `depth`. Mangler bildet — noe som skjer så lenge designprosjektets PNG-er
 * ikke er lastet inn — returneres `undefined`, og flatene faller tilbake på
 * sandflaten fra designsystemet. Det er samme bakgrunn lerretene selv bruker
 * bak bildene, så en manglende fil ser ikke ødelagt ut.
 */
export function mediaUrl(value: number | Media | null | undefined): string | undefined {
  if (!value || typeof value === 'number') return undefined
  return value.url ?? undefined
}

/** Alt-teksten fra mediefila, eventuelt overstyrt lokalt. */
export function mediaAlt(
  value: number | Media | null | undefined,
  override?: string | null,
): string {
  if (override) return override
  if (!value || typeof value === 'number') return ''
  return value.alt ?? ''
}
