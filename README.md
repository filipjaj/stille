# stille

En nettbutikk-boilerplate for norsk B2C, bygget på [Payload CMS 3](https://payloadcms.com) og
Cloudflare Workers med D1 og R2.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/filipjaj/stille)

> **Krever betalt Workers-plan.** Payload-bunten er større enn gratisplanens
> størrelsesgrense for Workers.

## Hva du får

Butikkfronten og adminen deler ett designsystem og én datamodell. Alt innhold ligger i
Payload — det finnes ingen hardkodede produkter, priser eller tekster i rutene.

|                  |                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Butikk**       | Forside, katalog, produktdetalj, journal, artikkel, lookbook, CMS-side, søk, kurv, kasse, bekreftelse, konto, innlogging, 404 |
| **Admin**        | Payloads eget panel, i butikkens visuelle uttrykk                                                                             |
| **Datamodell**   | Produkter med varianter og lager, kategorier, lookbooks, artikler, FAQ, sider med ni blokktyper, ordre, kurver, adresser      |
| **Betaling**     | Stripe: kort og Klarna i dag, Vipps når kontoen din har preview-tilgang                                                       |
| **Designsystem** | 28 komponenter, tokens for lys og mørk flate, egne fonter                                                                     |

## Kom i gang

```bash
pnpm install
cp .env.example .env          # fyll inn PAYLOAD_SECRET
pnpm payload migrate          # oppretter skjemaet i lokal D1
pnpm seed                     # demoinnhold, bilder og en administrator
pnpm dev
```

Butikken ligger på `localhost:3000`, adminen på `/admin`.

Seed skriver ut et generert administratorpassord første gang, med mindre du setter
`SEED_ADMIN_PASSWORD` selv. Det skrives bare ut én gang.

## Miljøvariabler

| Variabel                                | Nødvendig    | Hva den gjør                                |
| --------------------------------------- | ------------ | ------------------------------------------- |
| `PAYLOAD_SECRET`                        | ja           | Signerer sesjoner. `openssl rand -hex 32`   |
| `SEED_ADMIN_EMAIL`                      | nei          | Standard `admin@example.com`                |
| `SEED_ADMIN_PASSWORD`                   | nei          | Genereres tilfeldig hvis den er tom         |
| `NEXT_PUBLIC_SITE_URL`                  | for e-post   | Gjør lenker og bilder i e-postene absolutte |
| `STRIPE_SECRET_KEY`                     | for betaling | Serverside Stripe-nøkkel                    |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`    | for betaling | Klientside Stripe-nøkkel                    |
| `STRIPE_WEBHOOKS_SIGNING_SECRET`        | for betaling | Verifiserer webhooks                        |
| `RESEND_API_KEY`                        | for e-post   | Transaksjonelle e-poster                    |
| `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` | for e-post   | Avsender                                    |

## Noen valg som er verdt å kjenne til

**Priser lagres som heltall i øre, brutto inkludert MVA.** Det er norsk B2C-konvensjon:
prisen kunden ser er prisen som lagres, og MVA utledes per linje. All pengearitmetikk
ligger i `src/money`, uten Payload-avhengighet og med tester.

**D1 har ingen transaksjoner.** Ordre og transaksjon kan derfor ikke skrives atomisk.
I stedet er webhook-håndteringen idempotent: hendelses-ID-en skrives først, mot en
sammensatt unik indeks på `(provider, eventId)`. Et duplikat feiler der, før noen
sideeffekt. Se `src/collections/WebhookEvents.ts`.

**Dev kjører de samme migrasjonene som prod** (`push: false` på databaseadapteren).
Standardoppsettet pusher skjemaet direkte i dev, og da testes migrasjonene aldri før
deploydagen.

**Stripe-adapteren er skrevet fra grunnen** i stedet for pluginens egen, av to grunner:
pluginens webhook bruker synkron signaturverifisering, som kaster på Workers og gjør at
ingen ordre noen gang bekreftes; og den bruker kurvsummen fra requesten som beløp.
Vår henter kurven fra databasen og regner totalen selv. Se `src/payments/stripe/`.

**Adminen er Payloads egen, tematisert.** Panelet bygger på én gråtonerampe
(`--color-base-0` til `--color-base-1000`); vi bytter rampen i stedet for å overstyre
titalls avledede variabler, så mørkt tema følger med av seg selv. Se
`src/app/(payload)/custom.scss`.

## Deploy

```bash
pnpm deploy
```

Bygger og deployer worker-en. Krever at `wrangler.jsonc` peker på dine egne D1- og
R2-ressurser, og at `PAYLOAD_SECRET` er satt som secret:

```bash
wrangler secret put PAYLOAD_SECRET
```

Skjemaet trenger ingen egen kommando: `prodMigrations` i `src/payload.config.ts` gjør at
worker-en kjører ventende migrasjoner selv ved oppstart. Det er også grunnen til at
bygget aldri trenger tilgang til produksjonsdatabasen.

## Kommandoer

|                                      |                                              |
| ------------------------------------ | -------------------------------------------- |
| `pnpm dev`                           | Utviklingsserver                             |
| `pnpm seed`                          | Demoinnhold inn i Payload                    |
| `pnpm test:int`                      | Enhets- og integrasjonstester                |
| `pnpm test:e2e`                      | Playwright                                   |
| `pnpm payload migrate:create <navn>` | Ny migrasjon fra endringer i konfigurasjonen |

## Ikke ferdig

**Bildene er en demo, ikke en leveranse.** De sju i `public/images/` er
AI-genererte materialstudier som holder flatene i gang. To produkter og tre artikler
bruker et bilde i feil format og croppes; `docs/bildebrief.md` beskriver hva som mangler.

**Vipps krever preview-tilgang fra Stripe.** Betalingsadapteren er klar; metoden dukker
opp av seg selv i checkout når Stripe innvilger tilgang på kontoen din. Kort og Klarna
virker i mellomtiden.

## Lisens

MIT
