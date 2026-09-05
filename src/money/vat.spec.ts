import { describe, expect, it } from 'vitest'
import { extractVat, toVatRate } from './vat'

describe('extractVat', () => {
  it('trekker ut 25 % fra en bruttopris som går opp', () => {
    // 125,00 kr brutto = 100,00 kr netto + 25,00 kr MVA
    expect(extractVat(12500, 25)).toBe(2500)
  })

  it('trekker ut 15 % for næringsmidler', () => {
    // 10000 * 15 / 115 = 1304,34...
    expect(extractVat(10000, 15)).toBe(1304)
  })

  it('runder halve bort fra null', () => {
    // 14 * 12 / 112 = 1,5 nøyaktig
    expect(extractVat(14, 12)).toBe(2)
    expect(extractVat(-14, 12)).toBe(-2)
  })

  it('gir null MVA for nullsatsen', () => {
    expect(extractVat(19900, 0)).toBe(0)
  })

  it('gir null MVA for et nullbeløp', () => {
    expect(extractVat(0, 25)).toBe(0)
  })

  it('håndterer negative beløp for kreditnota', () => {
    expect(extractVat(-12500, 25)).toBe(-2500)
  })
})

describe('toVatRate', () => {
  it('konverterer Payloads select-strenger til satser', () => {
    expect(toVatRate('25')).toBe(25)
    expect(toVatRate('0')).toBe(0)
  })

  it('godtar tall direkte', () => {
    expect(toVatRate(15)).toBe(15)
  })

  it('kaster på en sats som ikke finnes i norsk rett', () => {
    expect(() => toVatRate('20')).toThrow('Ugyldig MVA-sats: 20')
  })
})
