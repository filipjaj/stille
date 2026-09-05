# Nettbutikk-boilerplate på Payload + Cloudflare Workers — design

Dato: 2026-09-05
Status: til gjennomgang
Dekker: spike 0 (ferdig) og milepæl 1 (fundament). Milepæl 2–7 er kun dekomponert, ikke spesifisert.

## 1. Mål og avgrensning

En boilerplate for norsk B2C-nettbutikk der en utvikler kloner repoet, fyller ut `.env`,
kjører ett script og har en kjørende butikk.

Målmarkedet er norsk B2C. Det er ikke en detalj — det bestemmer prismodellen (brutto inkl. MVA),
betalingsmetodene (Vipps må fungere) og MVA-satsene.

Avgrenset bort fra v1: abonnement, flerspråklig katalog, marketplace/Connect, lagerstyring
mot eksternt system, fraktbookingsintegrasjon mot Bring/Posten.

## 2. Verifiserte funn (spike 0)

Kjørt i `workerd` via `wrangler dev` med samme compatibility-flagg som prosjektet
(`nodejs_compat`, `global_fetch_strictly_public`, compat-dato `2025-08-15`).
Spike-koden er kastet og skal ikke inn i repoet.

| Spørsmål | Svar | Konsekvens |
| --- | --- | --- |
| Velger `stripe@22.6.1` en fungerende HTTP-klient i workerd? | Ja — `FetchHttpClient` velges automatisk | `createFetchHttpClient()` er unødvendig |
| Når API-kall fram? | Ja, 401 fra Stripe med ugyldig nøkkel | Transporten er ikke et problem |
| Virker `webhooks.constructEvent()` (synkron)? | **Nei.** Kaster `SubtleCryptoProvider cannot be used in a synchronous context` | Blokkerer bruk av pluginens webhook-endepunkt |
| Virker `webhooks.constructEventAsync()`? | Ja, verifiserer signaturen korrekt | Vår adapter må bruke denne |
| Kan `vipps_preview=v1` sendes via `apiVersion`-strengen? | **Ja, mekanismen virker.** `2025-06-30.preview; vipps_preview=v1` avvises med `You do not have permission to pass this beta header` — en tilgangsfeil, ikke en syntaksfeil | Stripe som eneste PSP er gjennomførbart. Mangler kun innvilget tilgang |
| Hvilke metoder gir en NOK-PaymentIntent i dag? | `card`, `klarna`, `link` | Brukbar fallback mens vi venter på Vipps |

To funn fra kildekodelesing, ikke fra kjøring:

- `@payloadcms/plugin-ecommerce@3.88.0` sin `webhooksEndpoint` kaller den **synkrone**
  `constructEvent` inne i en `try/catch` som logger og returnerer HTTP 400. På Workers gir det
  en stille feil: Stripe retry-er, ingen ordre blir noen gang bekreftet, og ingenting krasjer.
- `@payloadcms/db-d1-sqlite@3.88.0` setter `beginTransaction` til `defaultBeginTransaction()`
  med mindre `transactionOptions` er konfigurert (`payload.config.ts:73`). Den returnerer `null`,
  altså kjører alle skriv **uten transaksjon**.

Vi lar transaksjoner være av. D1 har ingen interaktive transaksjoner, så å slå på
`transactionOptions` ville bytte en kjent begrensning mot en ukjent feilmodus.
Konsistens løses med idempotens i stedet (avsnitt 6).

**Fortsatt ubesvart:** om Vipps faktisk dukker opp i `payment_method_types` når previewen er
innvilget. Mekanismen er bevist, entitlementet ikke. Kjør spiken på nytt etter innvilgelse.

Beslutningsregel: innvilges previewen, er Stripe eneste PSP. Avslås den, implementeres
Vipps ePayment som en andre adapter bak samme grensesnitt (milepæl 4b).
Ingenting i milepæl 1 avhenger av svaret.

**Konsekvens for adapteren:** vi pinner én `apiVersion`-konstant som brukes i `initiatePayment`,
`confirmOrder` og webhook-endepunktet, og som preview-flagget hektes på når tilgangen er der.
Pluginen defaulter til to *ulike* versjoner (`2025-06-30.preview` i `initiatePayment`,
`2025-03-31.basil` i `webhooksEndpoint`), noe vi ikke viderefører.

## 3. Arkitektur

Fire moduler med hver sin grunn til å eksistere. Grensene er valgt så hver enkelt kan forstås
og testes uten å lese naboen.

```
src/money/          Ren aritmetikk. Ingen Payload-import. Ingen I/O.
src/ecommerce/      Payload-konfigurasjon: access, collection-overstyringer.
src/payments/       PaymentAdapter-grensesnittet + Stripe-implementasjonen.
src/collections/    Eksisterende Payload-collections (Users, Media).
```

Avhengighetsretningen går én vei: `payments` og `ecommerce` bruker `money`.
`money` kjenner ingen av dem.

### 3.1 `src/money`

Det eneste stedet i kodebasen der penger regnes ut.

```ts
export type Ore = number          // heltall. Aldri float, aldri kroner.
export type VatRate = 0 | 12 | 15 | 25

export type Line = {
  unitGross: Ore                  // pris per enhet, inkludert MVA
  quantity: number
  vatRate: VatRate
}

export type LineTotals = {
  gross: Ore
  vat: Ore
  net: Ore
}

export type Totals = {
  lines: LineTotals[]
  itemsGross: Ore
  shippingGross: Ore
  grandTotalGross: Ore
  vatByRate: Partial<Record<VatRate, Ore>>
  totalVat: Ore
}

export function calculateTotals(
  lines: Line[],
  shipping: { gross: Ore; vatRate: VatRate },
): Totals
```

Regler:

- Alle beløp er heltall i øre. Flyttall forekommer ikke i modulen.
- Lagret pris er **brutto**, altså prisen kunden ser. MVA utledes:
  `vat = round(gross * rate / (100 + rate))`, avrundet halve bort fra null.
- MVA utledes **per linje**, deretter summeres. Ikke summer først og trekk ut etterpå —
  det gir avvik mot summen av linjene som vises i checkout.
- `shippingGross` behandles som en egen linje med egen sats. Frakt følger hovedvarens sats
  i norsk rett; boilerplaten defaulter til 25 % og gjør satsen konfigurerbar.
  Milepæl 3 avgjør om vi automatiserer regelen.

Satsene: 25 % standard, 15 % næringsmidler, 12 % persontransport/overnatting/kino,
0 % bøker, aviser og tidsskrifter.

### 3.2 `src/ecommerce/access`

`plugin-ecommerce` krever fire access-funksjoner — `adminOnlyFieldAccess`,
`adminOrPublishedStatus`, `isAdmin`, `isDocumentOwner` — og godtar fire valgfrie, hvorav vi
implementerer `isAuthenticated` og `isCustomer`. Typene er ikke like: `adminOnlyFieldAccess`
og `isCustomer` er `FieldAccess`, resten er `Access` og kan returnere en `Where`-spørring.

Disse implementeres mot et nytt `roles`-felt på `Users` (`admin` | `customer`, flervalg,
default `customer`). `isDocumentOwner` sammenligner `req.user.id` mot dokumentets
`customer`-relasjon, og returnerer `false` for gjester — gjestekurver identifiseres av
plugin-en selv og skal ikke slippe gjennom eierskapssjekken.

Access-funksjonene er rene funksjoner av `req` og testes direkte, uten Payload-instans.

### 3.3 `src/payments`

`PaymentAdapter`-grensesnittet fra `@payloadcms/plugin-ecommerce/types` re-eksporteres her,
slik at resten av koden aldri importerer PSP-spesifikke typer.

Vår Stripe-adapter implementerer de tre delene selv i stedet for å bruke `stripeAdapter`:

- `initiatePayment` — bygger `Line[]` fra kurven, kaller `calculateTotals`, oppretter
  PaymentIntent med **`grandTotalGross`**, oppretter ordre i `pending` og transaksjon.
- `confirmOrder` — verifiserer PaymentIntent-status mot Stripe før ordren markeres betalt.
  Klienten er aldri kilden til betalingsstatus.
- `webhooks` — eget endepunkt som bruker `constructEventAsync`.

`automatic_payment_methods: { enabled: true }` beholdes, slik at Vipps, Klarna og MobilePay
faller ut av Stripe-kontoens innstillinger uten kodeendring.

## 4. Datamodell

Collections kommer fra `plugin-ecommerce` (products, variants, carts, orders, transactions,
addresses) med `users` som customer-collection. Overstyringene i milepæl 1:

- `products`: nytt felt `vatRate` (select, default `25`). Påkrevd.
- Valuta konfigureres til `NOK` som eneste og default valuta. Da genererer plugin-en
  `priceInNOK` som heltall i øre.
- Ny collection `webhookEvents`: `{ eventId: text (unique, indexed), type: text, processedAt: date }`.
  Se avsnitt 6.

## 5. Feilhåndtering

- Beløpsavvik: `confirmOrder` sammenligner PaymentIntent-beløpet mot en ny beregning av
  ordretotalen. Avvik logges som `error` og ordren markeres `requires_review`, ikke `paid`.
  Dette fanger både prisendringer midt i checkout og forsøk på manipulering.
- Stripe utilgjengelig under `initiatePayment`: feilen bobler til klienten, ingen ordre opprettes.
- Webhook med ugyldig signatur: HTTP 400, ingen skriv. Stripe slutter å retry-e etter sine egne regler.
- Webhook for ukjent ordre: HTTP 200 og en `warn`-logg. Å returnere feil ville gitt evig retry.

## 6. Konsistens uten transaksjoner

D1 gir oss ikke atomiske flerdokumentskriv. I stedet:

1. `initiatePayment` skriver ordre (`pending`), så transaksjon, så kaller Stripe.
   Rekkefølgen er valgt slik at en halvveis skriving etterlater en ordre uten betaling —
   synlig og opprydningsbar — i stedet for en betaling uten ordre.
2. Webhook-handleren gjør et `create` mot `webhookEvents` med `event.id` **først**.
   Unik indeks gjør at et duplikat feiler, og handleren returnerer 200 uten å gjøre noe mer.
   Det gir at-most-once-behandling uten låsing.
3. Alle statusoverganger er idempotente: å sette en allerede `paid` ordre til `paid` er en no-op.

Dette er svakere enn transaksjoner, og det skal stå i README-en. Det er riktig avveining her:
alternativet er å bytte databaseadapter, og D1 er valgt bevisst.

## 7. Testing

| Enhet | Hvordan | Hvorfor |
| --- | --- | --- |
| `src/money` | Vitest, tabelldrevet. Avrunding, blandede satser, nullkurv, store kvanta | Ren funksjon, høyest verdi per testlinje. Feil her gir feil beløp til kunden |
| `src/ecommerce/access` | Vitest med konstruerte `req`-objekter | Sikkerhetsgrense. Særlig at gjest ikke eier andres dokumenter |
| Webhook-idempotens | Integrasjonstest mot lokal D1: samme event to ganger, forvent én statusendring | Erstatter transaksjoner. Må bevises, ikke antas |
| Checkout ende-til-ende | Playwright mot `wrangler dev` med Stripe testkort | Eneste testen som kjører i ekte workerd |

Ingen tester på genererte Payload-collections eller trivielle felt.

## 8. Leveranse, milepæl 1

Nye filer:

```
src/money/types.ts
src/money/vat.ts
src/money/vat.spec.ts
src/money/totals.ts
src/money/totals.spec.ts
src/money/index.ts
src/ecommerce/access/index.ts
src/ecommerce/access/index.spec.ts
src/ecommerce/fields/vatRate.ts
src/ecommerce/config.ts
src/collections/WebhookEvents.ts
src/seed/index.ts
src/seed/run.ts
```

Endrede filer:

```
src/collections/Users.ts     roles-felt
src/payload.config.ts        reparert migrasjonsimport, montering av plugin + e-postadapter
vitest.config.mts            plukk opp enhetstester i src/
package.json                 nye avhengigheter, seed-script
.env.example                 nye variabler
```

Pre-eksisterende feil som må rettes først: `src/payload.config.ts:13` default-importerer
`./db/migrations`, men migrasjonene ligger i `src/migrations/` og eksporteres navngitt.
Prosjektet typechecker ikke i dag. Importen kobles samtidig til `prodMigrations`, som var
den åpenbare hensikten.

Merk: `.env`-filer er utenfor det jeg har lesetilgang til i denne sesjonen. Endringene i
`.env.example` leveres som en diff du limer inn selv, eller via en Handoff-oppgave.

Nye avhengigheter — **krever din OK før installasjon**:

- `@payloadcms/plugin-ecommerce@3.88.0` — kjernen i butikken
- `stripe@22.6.1` — verifisert å fungere i workerd
- `@payloadcms/email-resend@3.88.0` — fetch-basert, i motsetning til nodemailer som ikke
  kan kjøre på Workers. Brukes først i milepæl 6, men monteres nå så konfigurasjonen er komplett

Ferdigkriterium for milepæl 1: `pnpm dev` starter, admin-panelet viser produkter, varianter,
kurver og ordre, migrasjonene kjører mot D1, seed oppretter en admin og tre produkter med
ulike MVA-satser, og `pnpm test:int` er grønn.

## 9. Dekomponering av resten

Hver milepæl får sin egen spec og plan.

| # | Milepæl | Avhenger av |
| --- | --- | --- |
| 2 | Katalog, varianter, kurv, storefront-skjelett | 1 |
| 3 | Frakt og fraktsoner, MVA-visning i checkout | 1 |
| 4a | Stripe-adapter: initiate, confirm, webhooks | 1, 3 |
| 4b | Vipps ePayment-adapter *(kun hvis Stripe-preview ikke innvilges)* | 4a |
| 5 | Kundekontoer, adressebok, ordrehistorikk | 2 |
| 6 | Innholdssider og transaksjonelle e-poster | 1 |
| 7 | `pnpm setup`: D1/R2-oppretting, migrasjoner, seed, sanity-sjekk | 2–6 |

Milepæl 3 kommer før 4a med vilje: adapteren trenger en korrekt ordretotal å sende til Stripe,
og den totalen finnes ikke før frakt og MVA er på plass.

## 10. Åpne risikoer

| Risiko | Håndtering |
| --- | --- |
| Vipps-preview innvilges ikke | Milepæl 4b. Grensesnittet er allerede satt, så kjernen røres ikke. Butikken er lanserbar med kort + Klarna i mellomtiden |
| Preview-API-versjonen endres eller trekkes av Stripe | `apiVersion` er én konstant ett sted. Bytte er en enlinjes endring, ikke et søk gjennom adapteren |
| `plugin-ecommerce` endrer datamodell mellom versjoner | Payload-versjonene pinnes eksakt. Oppgradering er en egen oppgave med diff |
| Pluginens øvrige endepunkter har flere Workers-inkompatibiliteter | Milepæl 2 starter med å kjøre kurv-endepunktene i `wrangler dev`, ikke `next dev` |
| D1-størrelsesgrenser ved stor katalog | Ikke et v1-problem. Noteres i README |
