import { describe, expect, it } from 'vitest'

import { absoluteUrl, emailDocument } from './document'
import { orderConfirmation } from './OrderConfirmation'

/**
 * E-post-HTML er ikke web-HTML.
 *
 * Testene her handler ikke om at komponenten rendrer — det gjør den åpenbart —
 * men om at den rendrer noe e-postklienter faktisk forstår. Reglene under er
 * de som oftest brytes, og som ikke merkes før en kunde åpner kvitteringen i
 * Outlook og ser Times New Roman i en kolonne som har falt sammen.
 */

const html = emailDocument({
  title: 'Ordrebekreftelse ST-1',
  preheader: 'Takk for bestillingen.',
  body: orderConfirmation({
    firstName: 'Anna',
    orderNo: 'ST-24187',
    lines: [
      { title: 'Keramikk og lin', meta: '1 stk', sum: '640,–' },
      {
        title: 'Lys gjennom lin',
        meta: '1 stk',
        sum: '890,–',
        imageUrl: 'https://stille.example/images/x.png',
      },
    ],
    subtotal: '1 530,–',
    shipping: 'Fri',
    total: '1 530,–',
    deliveryName: 'Anna Eksempel',
    deliveryAddress: ['Eksempelveien 1', '0001 Oslo'],
    orderUrl: 'https://stille.example/konto',
  }),
})

describe('ordrebekreftelse som e-post-HTML', () => {
  it('er et fullt dokument med doctype og tegnsett', () => {
    expect(html.startsWith('<!DOCTYPE html')).toBe(true)
    expect(html).toContain('charset=UTF-8')
    expect(html).toContain('<title>')
  })

  it('har en preheader før innholdet, så innboksen ikke plukker en tilfeldig setning', () => {
    const preheaderAt = html.indexOf('Takk for bestillingen.')
    const bodyAt = html.indexOf('Ordrebekreftelse ·')
    expect(preheaderAt).toBeGreaterThan(-1)
    expect(preheaderAt).toBeLessThan(bodyAt)
    // Skjult, men til stede.
    expect(html).toContain('mso-hide:all')
  })

  it('bruker ingen font-shorthand — Outlook ignorerer den', () => {
    // `font:` som CSS-egenskap, ikke `font-family` / `font-size`.
    expect(html).not.toMatch(/[;"]\s*font\s*:/)
    expect(html).toContain('font-family')
    expect(html).toContain('font-size')
  })

  it('bruker ingen layout e-postklienter ikke støtter', () => {
    for (const forbidden of ['display:flex', 'display:grid', 'position:absolute', 'float:']) {
      expect(html).not.toContain(forbidden)
    }
  })

  it('har ingen eksterne stilark, ressurshint eller skript', () => {
    expect(html).not.toContain('<link')
    expect(html).not.toContain('<script')
    // Alt av layout skal ligge inline på elementene.
    expect(html).toContain('style="')
  })

  it('gir ytre tabell en bredde som attributt, ikke bare i CSS', () => {
    // Outlook ignorerer max-width og strekker tabellen over hele vinduet.
    expect(html).toMatch(/<table[^>]*width="600"/)
  })

  it('gir bilder eksplisitt bredde, og hopper over dem som mangler', () => {
    expect(html).toMatch(/<img[^>]*width="88"/)
    // Linja uten bilde skal ikke gi en img med tom src.
    expect(html).not.toMatch(/<img[^>]*src=""/)
  })

  it('peker bilder på et fullt domene — e-post har ingen base-URL', () => {
    for (const src of html.match(/<img[^>]*src="([^"]*)"/g) ?? []) {
      expect(src).toMatch(/src="https?:\/\//)
    }
  })

  it('viser beløpene som er sendt inn', () => {
    expect(html).toContain('1 530,–')
    expect(html).toContain('640,–')
    expect(html).toContain('Fri')
  })

  it('tar vare på norske tegn', () => {
    expect(html).toContain('gjør')
    expect(html).toContain('på vei')
  })
})

describe('escaping', () => {
  it('lukker ikke dokumentet på et produktnavn med markup i seg', () => {
    const evil = orderConfirmation({
      firstName: 'Anna',
      orderNo: 'ST-1',
      lines: [{ title: '<script>alert(1)</script>', meta: '1 stk', sum: '1,–' }],
      subtotal: '1,–',
      shipping: 'Fri',
      total: '1,–',
      deliveryName: 'Anna',
      deliveryAddress: [],
      orderUrl: 'https://stille.example/konto',
    })

    expect(evil).not.toContain('<script')
    expect(evil).toContain('&lt;script&gt;')
  })

  it('bryter ikke ut av et href-attributt', () => {
    const evil = orderConfirmation({
      firstName: 'Anna',
      orderNo: 'ST-1',
      lines: [],
      subtotal: '1,–',
      shipping: 'Fri',
      total: '1,–',
      deliveryName: 'Anna',
      deliveryAddress: [],
      orderUrl: 'https://stille.example/" onclick="alert(1)',
    })

    // Det avgjørende er at anførselstegnet aldri overlever rått: uten det kan
    // ingenting lukke href-verdien og starte et nytt attributt. Teksten
    // «onclick=» blir stående inne i verdien, og er da bare tekst.
    expect(evil).not.toContain('example/" onclick')
    expect(evil).toContain('&quot; onclick=&quot;')
  })
})

describe('absoluteUrl', () => {
  it('lar en ferdig absolutt URL stå', () => {
    expect(absoluteUrl('https://cdn.example/x.jpg', 'https://stille.example')).toBe(
      'https://cdn.example/x.jpg',
    )
  })

  it('setter base foran en relativ sti, uten dobbel skråstrek', () => {
    expect(absoluteUrl('/api/media/file/x.jpg', 'https://stille.example/')).toBe(
      'https://stille.example/api/media/file/x.jpg',
    )
  })

  it('gir undefined heller enn en relativ sti når base mangler', () => {
    // Uten NEXT_PUBLIC_SITE_URL er sandflaten bedre enn et brutt bildeikon.
    expect(absoluteUrl('/api/media/file/x.jpg', '')).toBeUndefined()
    expect(absoluteUrl(undefined, 'https://stille.example')).toBeUndefined()
  })
})
