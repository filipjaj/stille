# Milepæl 1 — fundament: implementasjonsplan

> **For agentiske arbeidere:** PÅKREVD SUB-SKILL: bruk superpowers:subagent-driven-development
> (anbefalt) eller superpowers:executing-plans for å gjennomføre denne planen oppgave for
> oppgave. Stegene bruker checkbox-syntaks (`- [ ]`) for sporing.

**Mål:** Montere `@payloadcms/plugin-ecommerce` på det eksisterende Payload/D1-oppsettet, med
en egen, testet pengemodul for norsk MVA og de access-funksjonene plugin-en krever.

**Arkitektur:** All pengearitmetikk isoleres i `src/money`, en ren modul uten Payload-import
og uten I/O — det er det eneste stedet beløp regnes ut. `src/ecommerce` holder Payload-
konfigurasjonen: access-funksjoner og collection-overstyringer. Betalingsadaptere kommer først
i milepæl 4a, så plugin-en monteres med tom `paymentMethods`-liste.

**Teknologi:** Payload 3.88.0, `@payloadcms/db-d1-sqlite` (D1/SQLite), Next 16 på Cloudflare
Workers via OpenNext, vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-05-nettbutikk-boilerplate-design.md`

## Globale rammer

- Payload-pakker pinnes eksakt til `3.88.0`. Ingen `^`-ranges.
- Alle beløp er **heltall i øre**. Flyttall forekommer ikke i `src/money`.
- Lagret pris er **brutto**, inkludert MVA. MVA utledes, aldri legges på.
- MVA-satser: `25` standard, `15` næringsmidler, `12` persontransport/overnatting/kino,
  `0` bøker/aviser/tidsskrifter.
- Ingen `any` uten en inline-kommentar som forklarer hvorfor.
- Testfiler heter `*.spec.ts` og ligger ved siden av koden de tester i `src/`.
  Integrasjonstester beholder eksisterende plassering i `tests/int/*.int.spec.ts`.
- Conventional commits. Emne ≤ 72 tegn, imperativ, uten punktum.
- D1 kjører **uten transaksjoner**. Ingen kode i denne planen skal anta atomiske
  flerdokumentskriv.

---

### Oppgave 1: Reparer migrasjonsimporten

`src/payload.config.ts:13` gjør `import migrations from './db/migrations'`. Den katalogen
finnes ikke — migrasjonene ligger i `src/migrations/`, og `src/migrations/index.ts` eksporterer
`migrations` som et **navngitt** eksport, ikke default. Både stien og importformen er feil.
Prosjektet typechecker derfor ikke i dag, og ingenting annet i planen kan verifiseres før
dette er rettet.

Importen er i dag ubrukt. Vi kobler den til `prodMigrations` slik den åpenbart var ment: uten
den kan skjemaet stille drifte fra migrasjonene hvis noen glemmer `pnpm deploy:database`.
Payload hopper over steget når ingen migrasjoner er ventende, så kostnaden er null i praksis.

**Filer:**
- Endre: `src/payload.config.ts:13` og `src/payload.config.ts:73-75`

**Grensesnitt:**
- Konsumerer: `migrations` fra `src/migrations/index.ts`
- Produserer: et prosjekt som typechecker. Alle senere oppgaver avhenger av dette.

- [ ] **Steg 1: Bekreft at feilen finnes**

Kjør: `pnpm exec tsc --noEmit`

Forventet: nøyaktig én feil —
`src/payload.config.ts(13,24): error TS2307: Cannot find module './db/migrations'`

Ser du flere feil, stopp og rapporter. Planen antar at dette er den eneste.

- [ ] **Steg 2: Rett importen**

Bytt linje 13 i `src/payload.config.ts`:

```ts
import { migrations } from './migrations'
```

- [ ] **Steg 3: Koble migrasjonene til adapteren**

Bytt `db`-blokken i `src/payload.config.ts`:

```ts
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    prodMigrations: migrations,
  }),
```

- [ ] **Steg 4: Verifiser at typecheck er grønn**

Kjør: `pnpm exec tsc --noEmit`

Forventet: ingen output, exit 0.

- [ ] **Steg 5: Commit**

```bash
git add src/payload.config.ts
git commit -m "fix: rett migrasjonsimport i payload-konfigurasjonen"
```

---

### Oppgave 2: MVA-utledning i `src/money`

Den subtile delen av hele milepælen. Norsk B2C lagrer bruttopris, altså prisen kunden ser,
og MVA-en er allerede inni det tallet. Å legge på 25 % er feil; vi skal trekke ut andelen:
`vat = gross * rate / (100 + rate)`.

Avrunding gjøres halve **bort fra null**. `Math.round` alene gjør det ikke: `Math.round(-2.5)`
gir `-2`, ikke `-3`. Negative beløp forekommer ved kreditnota, så det må stemme.

**Filer:**
- Endre: `vitest.config.mts`
- Opprett: `src/money/types.ts`
- Opprett: `src/money/vat.ts`
- Test: `src/money/vat.spec.ts`

**Grensesnitt:**
- Konsumerer: ingenting
- Produserer:
  - `type Ore = number`
  - `type VatRate = 0 | 12 | 15 | 25`
  - `type Line = { unitGross: Ore; quantity: number; vatRate: VatRate }`
  - `type LineTotals = { gross: Ore; vat: Ore; net: Ore }`
  - `extractVat(gross: Ore, rate: VatRate): Ore`
  - `toVatRate(value: string | number): VatRate`

- [ ] **Steg 1: La vitest plukke opp enhetstester i `src/`**

Vitest ser i dag kun i `tests/int/`. Bytt `include`-linja i `vitest.config.mts`:

```ts
    include: ['tests/int/**/*.int.spec.ts', 'src/**/*.spec.ts'],
```

- [ ] **Steg 2: Skriv typene**

Opprett `src/money/types.ts`:

```ts
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
```

- [ ] **Steg 3: Skriv de feilende testene**

Opprett `src/money/vat.spec.ts`:

```ts
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
```

- [ ] **Steg 4: Kjør testene og se at de feiler**

Kjør: `pnpm exec vitest run src/money/vat.spec.ts`

Forventet: FAIL med at `./vat` ikke kan resolves.

- [ ] **Steg 5: Skriv implementasjonen**

Opprett `src/money/vat.ts`:

```ts
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
```

- [ ] **Steg 6: Kjør testene og se at de passerer**

Kjør: `pnpm exec vitest run src/money/vat.spec.ts`

Forventet: 9 tester passerer.

- [ ] **Steg 7: Commit**

```bash
git add vitest.config.mts src/money/types.ts src/money/vat.ts src/money/vat.spec.ts
git commit -m "feat: legg til MVA-utledning for bruttopriser i øre"
```

---

### Oppgave 3: Ordretotaler

Setter sammen linjer og frakt til en total. Dette er tallet betalingsadapteren sender til
Stripe i milepæl 4a, så det må stemme med det kunden ser i checkout — derfor utledes MVA per
linje og summeres, ikke omvendt.

**Filer:**
- Opprett: `src/money/totals.ts`
- Opprett: `src/money/index.ts`
- Test: `src/money/totals.spec.ts`

**Grensesnitt:**
- Konsumerer: `extractVat` og typene fra oppgave 2
- Produserer:
  - `type Shipping = { gross: Ore; vatRate: VatRate }`
  - `type Totals = { lines: LineTotals[]; itemsGross: Ore; shippingGross: Ore; grandTotalGross: Ore; vatByRate: Partial<Record<VatRate, Ore>>; totalVat: Ore }`
  - `calculateTotals(lines: Line[], shipping: Shipping): Totals`
  - `src/money/index.ts` re-eksporterer alt fra `types`, `vat` og `totals`

- [ ] **Steg 1: Skriv de feilende testene**

Opprett `src/money/totals.spec.ts`:

```ts
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
```

- [ ] **Steg 2: Kjør testene og se at de feiler**

Kjør: `pnpm exec vitest run src/money/totals.spec.ts`

Forventet: FAIL med at `./totals` ikke kan resolves.

- [ ] **Steg 3: Skriv implementasjonen**

Opprett `src/money/totals.ts`:

```ts
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
```

- [ ] **Steg 4: Kjør testene og se at de passerer**

Kjør: `pnpm exec vitest run src/money/totals.spec.ts`

Forventet: 7 tester passerer.

- [ ] **Steg 5: Lag modulens offentlige flate**

Opprett `src/money/index.ts`:

```ts
export * from './types'
export * from './vat'
export * from './totals'
```

- [ ] **Steg 6: Kjør hele testsuiten**

Kjør: `pnpm exec vitest run src/money`

Forventet: 16 tester passerer.

- [ ] **Steg 7: Commit**

```bash
git add src/money/totals.ts src/money/totals.spec.ts src/money/index.ts
git commit -m "feat: beregn ordretotaler med MVA gruppert per sats"
```

---

### Oppgave 4: Roller på Users

Access-funksjonene i oppgave 5 trenger noe å lese. `Users` har i dag ingen felter utover
det `auth: true` gir.

**Filer:**
- Endre: `src/collections/Users.ts`

**Grensesnitt:**
- Produserer: feltet `roles` på `users`, et flervalg med verdiene `admin` og `customer`.
  Oppgave 5 leser dette.

- [ ] **Steg 1: Legg til roles-feltet**

Bytt innholdet i `src/collections/Users.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['customer'],
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Kunde', value: 'customer' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
```

- [ ] **Steg 2: Regenerer Payload-typene**

Kjør: `pnpm run generate:types:payload`

Forventet: `src/payload-types.ts` får `roles?: ('admin' | 'customer')[] | null` på `User`.

- [ ] **Steg 3: Verifiser typecheck**

Kjør: `pnpm exec tsc --noEmit`

Forventet: ingen output, exit 0.

- [ ] **Steg 4: Commit**

```bash
git add src/collections/Users.ts src/payload-types.ts
git commit -m "feat: legg til roller på brukere"
```

---

### Oppgave 5: Access-funksjoner

`ecommercePlugin` krever fire access-funksjoner og godtar fire valgfrie. Merk at typene
ikke er like: `adminOnlyFieldAccess` og `isCustomer` er `FieldAccess`, resten er `Access`.
`Access` kan returnere en `Where`-spørring i tillegg til boolean, og det utnytter vi for
eierskap og publiseringsstatus.

Sikkerhetsgrensen som må stemme: en gjest uten bruker skal aldri eie et dokument, og en
innlogget kunde skal aldri se en annen kundes ordre.

**Filer:**
- Opprett: `src/ecommerce/access/index.ts`
- Test: `src/ecommerce/access/index.spec.ts`

**Grensesnitt:**
- Konsumerer: `roles`-feltet fra oppgave 4
- Produserer: `isAdmin`, `isAuthenticated`, `isDocumentOwner`, `adminOrPublishedStatus`
  (alle `Access`), `adminOnlyFieldAccess` og `isCustomer` (begge `FieldAccess`).
  Oppgave 7 sender disse inn i plugin-en.

- [ ] **Steg 1: Skriv de feilende testene**

Opprett `src/ecommerce/access/index.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { PayloadRequest } from 'payload'
import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
} from './index'

// Access-funksjonene leser utelukkende req.user. Vi konstruerer et minimalt
// objekt og caster, framfor å starte en hel Payload-instans for en ren predikattest.
const args = (user: unknown) => ({ req: { user } as PayloadRequest })

const admin = { id: 1, roles: ['admin'] }
const customer = { id: 42, roles: ['customer'] }
const guest = null

describe('isAdmin', () => {
  it('slipper gjennom en administrator', () => {
    expect(isAdmin(args(admin))).toBe(true)
  })

  it('avviser en kunde', () => {
    expect(isAdmin(args(customer))).toBe(false)
  })

  it('avviser en gjest', () => {
    expect(isAdmin(args(guest))).toBe(false)
  })

  it('avviser en bruker uten roller', () => {
    expect(isAdmin(args({ id: 7 }))).toBe(false)
  })
})

describe('isAuthenticated', () => {
  it('slipper gjennom enhver innlogget bruker', () => {
    expect(isAuthenticated(args(customer))).toBe(true)
  })

  it('avviser en gjest', () => {
    expect(isAuthenticated(args(guest))).toBe(false)
  })
})

describe('isCustomer', () => {
  it('slipper gjennom en kunde', () => {
    expect(isCustomer(args(customer))).toBe(true)
  })

  it('avviser en gjest', () => {
    expect(isCustomer(args(guest))).toBe(false)
  })
})

describe('adminOnlyFieldAccess', () => {
  it('slipper gjennom en administrator', () => {
    expect(adminOnlyFieldAccess(args(admin))).toBe(true)
  })

  it('avviser en kunde', () => {
    expect(adminOnlyFieldAccess(args(customer))).toBe(false)
  })
})

describe('isDocumentOwner', () => {
  it('gir en administrator full tilgang', () => {
    expect(isDocumentOwner(args(admin))).toBe(true)
  })

  it('begrenser en kunde til egne dokumenter', () => {
    expect(isDocumentOwner(args(customer))).toEqual({
      customer: { equals: 42 },
    })
  })

  it('avviser en gjest fullstendig', () => {
    // Kritisk: en gjest må aldri få en Where-spørring som kan matche noe.
    expect(isDocumentOwner(args(guest))).toBe(false)
  })
})

describe('adminOrPublishedStatus', () => {
  it('gir en administrator tilgang til utkast', () => {
    expect(adminOrPublishedStatus(args(admin))).toBe(true)
  })

  it('begrenser alle andre til publiserte dokumenter', () => {
    expect(adminOrPublishedStatus(args(guest))).toEqual({
      _status: { equals: 'published' },
    })
  })
})
```

- [ ] **Steg 2: Kjør testene og se at de feiler**

Kjør: `pnpm exec vitest run src/ecommerce/access/index.spec.ts`

Forventet: FAIL med at `./index` ikke kan resolves.

- [ ] **Steg 3: Skriv implementasjonen**

Opprett `src/ecommerce/access/index.ts`:

```ts
import type { Access, FieldAccess } from 'payload'

type Role = 'admin' | 'customer'

/**
 * req.user er typet som den autentiserte collection-en, som ikke nødvendigvis
 * har roller. Vi smalner den til den formen vi faktisk leser.
 */
type UserWithRoles = {
  id: number | string
  roles?: Role[] | null
}

const hasRole = (user: unknown, role: Role): boolean => {
  const roles = (user as UserWithRoles | null | undefined)?.roles
  return Array.isArray(roles) && roles.includes(role)
}

export const isAdmin: Access = ({ req }) => hasRole(req.user, 'admin')

export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

export const isCustomer: FieldAccess = ({ req }) => hasRole(req.user, 'customer')

export const adminOnlyFieldAccess: FieldAccess = ({ req }) => hasRole(req.user, 'admin')

/**
 * Administratorer ser utkast. Alle andre ser kun publiserte dokumenter.
 * Produkt-collection-en har drafts påslått av plugin-en, så `_status` finnes.
 */
export const adminOrPublishedStatus: Access = ({ req }) => {
  if (hasRole(req.user, 'admin')) {
    return true
  }
  return { _status: { equals: 'published' } }
}

/**
 * Begrenser til dokumenter kunden eier. En gjest får `false`, ikke en tom
 * spørring — en spørring uten betingelser ville matchet alt.
 */
export const isDocumentOwner: Access = ({ req }) => {
  if (hasRole(req.user, 'admin')) {
    return true
  }
  if (!req.user) {
    return false
  }
  return { customer: { equals: req.user.id } }
}
```

- [ ] **Steg 4: Kjør testene og se at de passerer**

Kjør: `pnpm exec vitest run src/ecommerce/access/index.spec.ts`

Forventet: 15 tester passerer.

- [ ] **Steg 5: Commit**

```bash
git add src/ecommerce/access/index.ts src/ecommerce/access/index.spec.ts
git commit -m "feat: legg til access-funksjoner for ecommerce-plugin"
```

---

### Oppgave 6: WebhookEvents-collection

D1 gir ingen transaksjoner, så webhook-idempotens løses med en unik indeks i stedet.
Handleren i milepæl 4a skriver `event.id` hit **først**; et duplikat feiler på unikhet, og
handleren returnerer 200 uten å gjøre noe mer. Det gir at-most-once-behandling uten låsing.

Collection-en opprettes nå fordi den er del av skjemaet, og vi vil ha den med i samme
migrasjon som resten av milepælen.

**Filer:**
- Opprett: `src/collections/WebhookEvents.ts`

**Grensesnitt:**
- Konsumerer: `isAdmin` fra oppgave 5
- Produserer: collection-slug `webhook-events` med feltene `eventId` (unik, indeksert),
  `provider`, `type` og `processedAt`. Milepæl 4a skriver hit.

- [ ] **Steg 1: Opprett collection-en**

Opprett `src/collections/WebhookEvents.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../ecommerce/access'

/**
 * Idempotensjournal for innkommende webhooks. D1 har ingen transaksjoner, så den
 * unike indeksen på `eventId` er mekanismen som hindrer dobbeltbehandling:
 * handleren oppretter raden først, og et duplikat feiler før noen sideeffekt skjer.
 */
export const WebhookEvents: CollectionConfig = {
  slug: 'webhook-events',
  admin: {
    useAsTitle: 'eventId',
    defaultColumns: ['eventId', 'provider', 'type', 'processedAt'],
    group: 'Ecommerce',
    description:
      'Behandlede webhook-hendelser. Slettes ikke automatisk — se milepæl 7 for opprydding.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: () => false,
  },
  fields: [
    {
      name: 'eventId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Hendelses-ID fra betalingsleverandøren, for eksempel evt_123.',
      },
    },
    {
      name: 'provider',
      type: 'text',
      required: true,
      admin: {
        description: 'Navnet på betalingsadapteren, for eksempel stripe.',
      },
    },
    {
      name: 'type',
      type: 'text',
      required: true,
    },
    {
      name: 'processedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
}
```

Merk at `update` er hardkodet til `false`: en journalrad skal aldri endres, heller ikke av
en administrator. `create` er satt til `isAdmin` fordi webhook-handleren kjører med
`overrideAccess` og ikke går gjennom denne sjekken.

- [ ] **Steg 2: Verifiser typecheck**

Kjør: `pnpm exec tsc --noEmit`

Forventet: ingen output, exit 0. Collection-en er ikke registrert ennå — det skjer i oppgave 7.

- [ ] **Steg 3: Commit**

```bash
git add src/collections/WebhookEvents.ts
git commit -m "feat: legg til idempotensjournal for webhooks"
```

---

### Oppgave 7: Monter plugin-en

Setter sammen alt. Plugin-en monteres med tom `paymentMethods`-liste — adaptere kommer i
milepæl 4a, og typen tillater eksplisitt en tom liste.

`vatRate` legges på produkter via `productsCollectionOverride`. Valuta settes til NOK som
eneste støttede valuta, med to desimaler, slik at plugin-en genererer prisfelt i øre.

**Filer:**
- Opprett: `src/ecommerce/fields/vatRate.ts`
- Opprett: `src/ecommerce/config.ts`
- Endre: `src/payload.config.ts`

**Grensesnitt:**
- Konsumerer: access-funksjonene fra oppgave 5, `WebhookEvents` fra oppgave 6
- Produserer: `ecommerce` (plugin-instansen) og `NOK` (valutadefinisjonen).
  Milepæl 2 og 4a importerer `NOK`.

- [ ] **Steg 1: Lag MVA-feltet**

Opprett `src/ecommerce/fields/vatRate.ts`:

```ts
import type { Field } from 'payload'

/**
 * MVA-sats per produkt. Payload lagrer select-verdier som strenger; bruk
 * `toVatRate` fra src/money når verdien skal regnes med.
 */
export const vatRateField: Field = {
  name: 'vatRate',
  type: 'select',
  required: true,
  defaultValue: '25',
  label: 'MVA-sats',
  options: [
    { label: '25 % — standardsats', value: '25' },
    { label: '15 % — næringsmidler', value: '15' },
    { label: '12 % — persontransport, overnatting, kino', value: '12' },
    { label: '0 % — bøker, aviser, tidsskrifter', value: '0' },
  ],
  admin: {
    position: 'sidebar',
  },
}
```

- [ ] **Steg 2: Lag plugin-konfigurasjonen**

Opprett `src/ecommerce/config.ts`:

```ts
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import type { Currency } from '@payloadcms/plugin-ecommerce/types'

import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
} from './access'
import { vatRateField } from './fields/vatRate'

/** Norske kroner. `decimals: 2` gjør at plugin-en lagrer priser i øre. */
export const NOK: Currency = {
  code: 'NOK',
  decimals: 2,
  label: 'Norske kroner',
  symbol: 'kr',
  symbolDisplay: 'symbol',
}

export const ecommerce = ecommercePlugin({
  access: {
    adminOnlyFieldAccess,
    adminOrPublishedStatus,
    isAdmin,
    isAuthenticated,
    isCustomer,
    isDocumentOwner,
  },
  currencies: {
    defaultCurrency: 'NOK',
    supportedCurrencies: [NOK],
  },
  customers: {
    slug: 'users',
  },
  payments: {
    // Adaptere kommer i milepæl 4a. Tom liste er en gyldig konfigurasjon.
    paymentMethods: [],
  },
  products: {
    productsCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      fields: [...defaultCollection.fields, vatRateField],
    }),
  },
})
```

- [ ] **Steg 3: Monter plugin-en og e-postadapteren**

I `src/payload.config.ts`, legg til importene sammen med de eksisterende:

```ts
import { resendAdapter } from '@payloadcms/email-resend'
import { ecommerce } from './ecommerce/config'
import { WebhookEvents } from './collections/WebhookEvents'
```

Bytt `collections`-linja:

```ts
  collections: [Users, Media, WebhookEvents],
```

Bytt `plugins`-blokka:

```ts
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    ecommerce,
  ],
```

Legg til `email` rett etter `plugins`-blokka. `resendAdapter` er fetch-basert; nodemailer
kan ikke kjøre på Workers og er derfor ikke et alternativ her. E-post tas i bruk i milepæl 6,
men konfigureres nå så oppsettet er komplett:

```ts
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Nettbutikk',
  }),
```

- [ ] **Steg 4: Regenerer typer og importmap**

Kjør: `pnpm run generate:types:payload && pnpm run generate:importmap`

Forventet: `src/payload-types.ts` får `Product`, `Variant`, `Cart`, `Order`, `Transaction`,
`Address` og `WebhookEvent`. `src/app/(payload)/admin/importMap.js` får plugin-ens komponenter.

- [ ] **Steg 5: Verifiser typecheck**

Kjør: `pnpm exec tsc --noEmit`

Forventet: ingen output, exit 0.

Feiler den på `Currency`-importen fra `@payloadcms/plugin-ecommerce/types`, sjekk at
`exports`-feltet i pakken eksponerer `./types` — det gjorde det i 3.88.0.

- [ ] **Steg 6: Lag migrasjonen**

Kjør: `pnpm run payload migrate:create ecommerce_fundament`

Forventet: en ny `src/migrations/<tidsstempel>_ecommerce_fundament.ts` med tabeller for
produkter, varianter, kurver, ordre, transaksjoner, adresser og webhook-events, samt
`roles`-kolonnen på users. `src/migrations/index.ts` oppdateres automatisk.

Åpne migrasjonen og bekreft at `webhook_events` får en **unik** indeks på `event_id`.
Mangler den, er idempotensen i milepæl 4a verdiløs — stopp og rapporter.

- [ ] **Steg 7: Kjør migrasjonen mot lokal D1**

Kjør: `pnpm run payload migrate`

Forventet: migrasjonen kjører uten feil.

- [ ] **Steg 8: Verifiser at admin-panelet starter**

Kjør: `pnpm dev`, åpne `http://localhost:3000/admin`.

Forventet: gruppa «Ecommerce» i sidemenyen med Products, Variants, Carts, Orders,
Transactions, Addresses og Webhook Events. Åpne Products og bekreft at «MVA-sats» ligger i
sidepanelet med 25 % som forvalg.

Stopp serveren igjen.

- [ ] **Steg 9: Commit**

```bash
git add src/ecommerce src/payload.config.ts src/payload-types.ts src/migrations \
  "src/app/(payload)/admin/importMap.js"
git commit -m "feat: monter ecommerce-plugin med NOK og MVA-sats per produkt"
```

---

### Oppgave 8: Seed

En boilerplate må kunne demonstrere seg selv. Seed oppretter én administrator og tre
produkter med **ulike** MVA-satser, slik at pengemodulen faktisk blir utøvd og ikke bare
testet isolert.

Seed er idempotent på e-post og produktslug: å kjøre den to ganger skal ikke gi duplikater.
Det er ikke pynt — uten transaksjoner i D1 er en avbrutt seed en realistisk tilstand.

**Filer:**
- Opprett: `src/seed/index.ts`
- Opprett: `src/seed/run.ts`
- Endre: `package.json`

**Grensesnitt:**
- Konsumerer: collections fra oppgave 7
- Produserer: `seed(payload: Payload): Promise<void>` og kommandoen `pnpm seed`

- [ ] **Steg 1: Skriv seed-logikken**

Opprett `src/seed/index.ts`:

```ts
import type { Payload } from 'payload'

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'endre-meg'

/** Tre produkter med ulike MVA-satser, så pengemodulen blir utøvd av demodata. */
const PRODUCTS = [
  { title: 'Kaffekvern', slug: 'kaffekvern', vatRate: '25', priceInNOK: 129900 },
  { title: 'Kaffebønner 1 kg', slug: 'kaffebonner-1kg', vatRate: '15', priceInNOK: 34900 },
  { title: 'Boken om kaffe', slug: 'boken-om-kaffe', vatRate: '0', priceInNOK: 39900 },
]

export async function seed(payload: Payload): Promise<void> {
  const existingAdmin = await payload.find({
    collection: 'users',
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  })

  if (existingAdmin.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        roles: ['admin'],
      },
    })
    payload.logger.info(`Opprettet administrator ${ADMIN_EMAIL}`)
  } else {
    payload.logger.info(`Administrator ${ADMIN_EMAIL} finnes allerede, hopper over`)
  }

  for (const product of PRODUCTS) {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: product.slug } },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      payload.logger.info(`Produkt ${product.slug} finnes allerede, hopper over`)
      continue
    }

    await payload.create({
      collection: 'products',
      data: {
        title: product.title,
        slug: product.slug,
        vatRate: product.vatRate,
        priceInNOK: product.priceInNOK,
        _status: 'published',
      },
    })
    payload.logger.info(`Opprettet produkt ${product.slug}`)
  }
}
```

Feltnavnene `slug`, `priceInNOK` og `_status` kommer fra plugin-ens produkt-collection.
Avviker de fra `src/payload-types.ts` etter oppgave 7, rett dem her — typene er fasit.

- [ ] **Steg 2: Skriv kjørescriptet**

Opprett `src/seed/run.ts`:

```ts
import { getPayload } from 'payload'
import config from '@/payload.config'
import { seed } from './index'

const payload = await getPayload({ config: await config })
await seed(payload)
process.exit(0)
```

- [ ] **Steg 3: Legg til kommandoen**

Legg til i `scripts` i `package.json`, alfabetisk mellom `preview` og `start`:

```json
    "seed": "cross-env NODE_OPTIONS=\"--no-deprecation --import=tsx/esm\" tsx src/seed/run.ts",
```

- [ ] **Steg 4: Kjør seed**

Kjør: `pnpm seed`

Forventet: fire «Opprettet»-linjer i loggen, exit 0.

Feiler den på at `@/payload.config` ikke kan resolves, bytt importen i `src/seed/run.ts`
til den relative stien `'../payload.config'` — tsx leser tsconfig-paths, men oppsettet kan
avvike.

- [ ] **Steg 5: Verifiser idempotens**

Kjør: `pnpm seed`

Forventet: fire «finnes allerede, hopper over»-linjer, exit 0, ingen duplikater.

- [ ] **Steg 6: Bekreft i admin**

Kjør `pnpm dev` og åpne `http://localhost:3000/admin`. Logg inn med `SEED_ADMIN_EMAIL`.

Forventet: tre produkter, med MVA-satsene 25 %, 15 % og 0 %.

Stopp serveren igjen.

- [ ] **Steg 7: Commit**

```bash
git add src/seed package.json
git commit -m "feat: legg til idempotent seed med admin og demoprodukter"
```

---

### Oppgave 9: Miljøvariabler

`.env`-filer er utenfor det agenten har lesetilgang til. Denne oppgaven produserer derfor
en Handoff-oppgave i stedet for en redigering.

**Filer:**
- Opprett: en Handoff-oppgave i `~/.handoff/inbox/`

**Grensesnitt:**
- Konsumerer: variabelnavnene brukt i oppgave 7 og 8
- Produserer: en oppdatert `.env.example` i utviklerens hender

- [ ] **Steg 1: Lag Handoff-oppgaven**

Bruk `handoff`-skillen med ID `task-2026-09-05-env-example-milepael-1`. Oppgaven skal be
Filip legge til følgende i `.env.example`, og forklare at Payload allerede feiler med en
tydelig melding hvis `PAYLOAD_SECRET` mangler:

```
# Resend — transaksjonelle e-poster. Tas i bruk i milepæl 6.
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_FROM_NAME=Nettbutikk

# Seed. Endre passordet før første deploy.
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=endre-meg

# Stripe. Tas i bruk i milepæl 4a.
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOKS_SIGNING_SECRET=
```

- [ ] **Steg 2: Kjør full verifisering av milepælen**

Kjør: `pnpm exec tsc --noEmit && pnpm run lint && pnpm run test:int`

Forventet: alle tre grønne.

- [ ] **Steg 3: Commit hvis lint endret noe**

```bash
git add -A
git commit -m "chore: rett lint-avvik i milepæl 1"
```

Er det ingenting å committe, hopp over steget.

---

## Ferdigkriterium for milepæl 1

- `pnpm exec tsc --noEmit` er grønn
- `pnpm run test:int` er grønn, med 31 enhetstester i `src/` (16 i `money`, 15 i `access`)
- `pnpm dev` starter, og admin-panelet viser Ecommerce-gruppa med alle collections
- `pnpm seed` er idempotent og gir tre produkter med ulike MVA-satser
- Migrasjonen inneholder en unik indeks på `webhook_events.event_id`

Ikke i denne milepælen, med vilje: storefront, kurvlogikk, frakt, betalingsadapter,
kundekontoer, innholdssider og `pnpm setup`. Se dekomponeringen i spec-ens avsnitt 9.
