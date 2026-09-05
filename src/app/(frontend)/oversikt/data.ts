/**
 * Innholdet på oversiktssiden, portert fra designprosjektets
 * `Oversikt.dc.html` (renderVals()).
 *
 * Lenkene peker foreløpig på designlerretene, som er der skjermene finnes i dag.
 * Etter hvert som milepæl 2–6 lander byttes `href` ut med rutene i appen — se
 * docs/superpowers/specs/2026-09-05-nettbutikk-boilerplate-design.md avsnitt 9.
 */

const DESIGN_PROJECT = 'https://claude.ai/design/p/a1376a1c-dabf-4a68-8fbf-800599f9438e'

const canvas = (file: string): string =>
  `${DESIGN_PROJECT}?file=${encodeURIComponent(file)}`

const SHOP_MOBILE = canvas('Butikk mobil.dc.html')
const SHOP_DESKTOP = canvas('Butikk desktop.dc.html')
const ACCOUNT = canvas('Konto.dc.html')
const EMAIL = canvas('E-post ordrebekreftelse.dc.html')
const ADMIN_SHOP = canvas('Admin butikk.dc.html')
const ADMIN_CONTENT = canvas('Admin innhold.dc.html')

export type ScreenGroup = 'Butikk' | 'E-post' | 'Admin'

export type Screen = {
  /** Tosifret løpenummer, slik lerretet viser det. */
  no: string
  group: ScreenGroup
  title: string
  desc: string
  href: string
}

const SCREEN_ROWS: ReadonlyArray<[ScreenGroup, string, string, string]> = [
  ['Butikk', 'Forside', 'Hero, samlingsteaser, fire objekter, journalteaser', SHOP_MOBILE],
  ['Butikk', 'Journal', 'Kategorifilter Rom / Materialer / Mennesker', SHOP_MOBILE],
  ['Butikk', 'Artikkel', 'Lesekolonne, sitat, objekter fra fortellingen', SHOP_MOBILE],
  ['Butikk', 'Samling / lookbook', 'Bildeserie med produktkort under', SHOP_MOBILE],
  ['Butikk', 'Om oss', 'CMS-side bygget av seks blokker', SHOP_MOBILE],
  ['Butikk', 'Kategori', 'Sortering, tokolonners produktgrid', SHOP_MOBILE],
  ['Butikk', 'Produktdetalj', 'Variant, antall, legg i kurv, accordion', SHOP_MOBILE],
  ['Butikk', 'Handlekurv', 'Linjer med antall, sum, tom-tilstand', SHOP_MOBILE],
  ['Butikk', 'Checkout', 'Kontakt, levering, betaling, oppsummering', SHOP_MOBILE],
  ['Butikk', 'Bekreftelse', 'Ordrenummer og to veier videre', SHOP_MOBILE],
  ['Butikk', 'Søk', 'Live-søk i objekter og journal, lasting, tom-tilstand', SHOP_DESKTOP],
  ['Butikk', 'Feilside 404', 'Stor serif-kode, to veier videre', SHOP_DESKTOP],
  ['Butikk', 'Innlogging', 'Logg inn, opprett konto, glemt passord', ACCOUNT],
  ['Butikk', 'Konto', 'Ordre, ordredetalj, adresser, profil, lagrede', ACCOUNT],
  ['E-post', 'Ordrebekreftelse', '600px tabellbasert transaksjonsmal', EMAIL],
  ['Admin', 'Oversikt', 'KPI, siste ordre, lavt lager, innholdsstatus', ADMIN_SHOP],
  ['Admin', 'Ordre', 'Statusfaner, filter, valgbar tabell', ADMIN_SHOP],
  ['Admin', 'Ordredetalj', 'Varer, tidslinje, kunde og betaling', ADMIN_SHOP],
  ['Admin', 'Produkter', 'Liste med lager- og publiseringsstatus', ADMIN_SHOP],
  ['Admin', 'Produktredigering', 'Felt, varianter, bilder, fortellinger', ADMIN_SHOP],
  ['Admin', 'Kunder', 'Segmenter, forbruk, nyhetsbrev', ADMIN_SHOP],
  ['Admin', 'Sider', 'Liste med status, søk og filter', ADMIN_CONTENT],
  ['Admin', 'Rediger side', 'Blokkliste: flytt, dupliser, slett, legg til', ADMIN_CONTENT],
  ['Admin', 'Artikkel', 'Tittel, ingress, rik tekst, lenkede produkter', ADMIN_CONTENT],
]

export const screens: Screen[] = SCREEN_ROWS.map(([group, title, desc, href], index) => ({
  no: String(index + 1).padStart(2, '0'),
  group,
  title,
  desc,
  href,
}))

export type ModelRow = {
  name: string
  fields: string
}

export const collections: ModelRow[] = [
  {
    name: 'products',
    fields:
      'title, slug, sku, category →, collection →, price, compareAt, description, images[], variants[{name, sku, price, stock}], tags, seo',
  },
  { name: 'categories', fields: 'title, slug, intro, image' },
  {
    name: 'collections',
    fields: 'title, slug, season, intro, looks[{image, caption, products →}]',
  },
  {
    name: 'articles',
    fields:
      'title, lead, category (rom|materialer|mennesker), author →, readingTime, hero{image, caption, alt}, body (Lexical), products →, featured, publishedAt, seo',
  },
  { name: 'pages', fields: 'title, slug, layout (blocks[]), navPlacement, seo, _status, versions' },
  { name: 'faqs', fields: 'question, answer, order' },
  {
    name: 'orders',
    fields: 'orderNo, customer →, lines[], shipping, payment, total, status, timeline[]',
  },
  {
    name: 'customers · media · users',
    fields: 'Standard Payload. Media med focal point og alt-tekst påkrevd.',
  },
  {
    name: 'globals',
    fields: 'header (nav), footer, newsletter, shop (frakt, fri frakt-grense, betalingsmetoder)',
  },
]

export const blocks: ModelRow[] = [
  { name: 'hero', fields: 'eyebrow, title (kursiv med *…*), image 3:2' },
  {
    name: 'products',
    fields: 'title, source (manual | category | collection), products →, limit',
  },
  { name: 'richText', fields: 'body (Lexical)' },
  { name: 'imageText', fields: 'image 4:5, eyebrow, title, body, imageSide' },
  { name: 'quote', fields: 'quote, source' },
  { name: 'gallery', fields: 'images[] (2–3), captions' },
  { name: 'faq', fields: 'title, faqs →' },
  { name: 'newsletter', fields: 'eyebrow, title, buttonLabel' },
  { name: 'articleTeaser', fields: 'source (latest | pick), article →' },
]

export const assumptions: string[] = [
  'Demo-merke: keramikk, tekstil, eik. Tone som Kinfolk/Aesop – rolig, ingen kampanjespråk.',
  'Lookbook = redaksjonelle bildeserier med produktkort under hvert bilde (du hoppet over spørsmålet).',
  'Journal har tre kategorier: Rom, Materialer, Mennesker.',
  'Betaling: Vipps, kort, Klarna. Frakt 79,– / fri over 1 500,–.',
  'Payload-mappa «stille» er nesten tom, så datamodellen under er et forslag.',
  'Tema-tweak (paper/inverse) følger med på alle sider.',
]

export const nextSteps: string[] = [
  'Mobil- og tablet-variant av søk, konto og feilside.',
  'Ekte innhold og bilder når dere har det – nå er alt fiktivt og AI-generert.',
]

export type PrimaryLink = {
  label: string
  href: string
  variant: 'primary' | 'secondary'
}

export const primaryLinks: PrimaryLink[] = [
  { label: 'Butikk, mobil', href: SHOP_MOBILE, variant: 'primary' },
  { label: 'Butikk, desktop', href: SHOP_DESKTOP, variant: 'primary' },
  { label: 'Butikk, tablet', href: canvas('Butikk tablet.dc.html'), variant: 'primary' },
  { label: 'Admin: butikk', href: ADMIN_SHOP, variant: 'secondary' },
  { label: 'Admin: innhold', href: ADMIN_CONTENT, variant: 'secondary' },
]
