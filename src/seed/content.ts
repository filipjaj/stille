/**
 * Innholdet fra designprosjektets prototyper («Butikk mobil.dc.html» og
 * «Butikk desktop.dc.html»), i den formen seed-scriptet trenger.
 *
 * Dette er **kilden for seeding**, ikke en datakilde for flatene. Butikken
 * leser alt fra Payload; denne fila finnes bare for å fylle collections med
 * demoinnhold slik at en fersk klone har noe å vise.
 *
 * Prisene er heltall i øre, som i den ekte datamodellen — ikke kroner som i
 * prototypen — slik at seed og collections snakker samme språk.
 */
import type { Ore, VatRate } from '@/money'

export type ProductCategory = 'Objekter' | 'Tekstil' | 'Materialer'

export type Product = {
  id: number
  slug: string
  sku: string
  title: string
  category: ProductCategory
  /** Bruttopris inkludert MVA, i øre. */
  priceGross: Ore
  vatRate: VatRate
  image: string
  description: string
}

const image = (name: string): string => `/images/stille-${name}.png`

export const products: Product[] = [
  {
    id: 1,
    slug: 'keramikk-og-lin',
    sku: 'OBJ-001',
    title: 'Keramikk og lin',
    category: 'Objekter',
    priceGross: 64000,
    vatRate: 25,
    image: image('stilleben'),
    description: 'Et stilleben i steingods og vasket lin. Skål, kopp og duk som tåler daglig bruk.',
  },
  {
    id: 2,
    slug: 'lys-gjennom-lin',
    sku: 'TEK-004',
    title: 'Lys gjennom lin',
    category: 'Tekstil',
    priceGross: 89000,
    vatRate: 25,
    image: image('tekstil'),
    description: 'Gardin i tungt lin fra Normandie. Filtrerer lyset uten å stenge det ute.',
  },
  {
    id: 3,
    slug: 'eik-i-hverdagen',
    sku: 'MAT-002',
    title: 'Eik i hverdagen',
    category: 'Materialer',
    priceGross: 120000,
    vatRate: 25,
    image: image('materialer'),
    description: 'Skjærebrett og serveringsfat i oljet eik fra Østfold. Mørkner med årene.',
  },
  {
    id: 4,
    slug: 'morgenritual',
    sku: 'OBJ-007',
    title: 'Morgenritual',
    category: 'Objekter',
    priceGross: 48000,
    vatRate: 25,
    image: image('ritual'),
    description: 'Tekopp og lite fat i mørkt steingods. Formet for hendene, ikke for hyllen.',
  },
  {
    id: 5,
    slug: 'pledd-i-ull',
    sku: 'TEK-009',
    title: 'Pledd i ull',
    category: 'Tekstil',
    priceGross: 145000,
    vatRate: 25,
    image: image('lesestund'),
    description: 'Vevd i norsk ull. Tungt nok til november, mykt nok til mai.',
  },
  {
    id: 6,
    slug: 'krukke-limewash',
    sku: 'OBJ-012',
    title: 'Krukke, limewash',
    category: 'Objekter',
    priceGross: 72000,
    vatRate: 25,
    image: image('rom'),
    description: 'Håndformet krukke med kalket overflate. Ingen to er like.',
  },
]

export const productById = (id: number): Product => products.find((p) => p.id === id) ?? products[0]

export const productBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug)

/** Variantene er like for alle produkter i prototypen. «Kull» koster 50,– mer. */
export type VariantId = 'natur' | 'sand' | 'kull'

export const variantLabels: Record<VariantId, string> = {
  natur: 'Natur',
  sand: 'Sand',
  kull: 'Kull',
}

export const variantSurcharge: Record<VariantId, Ore> = {
  natur: 0,
  sand: 0,
  kull: 5000,
}

export const variantPrice = (product: Product, variant: VariantId): Ore =>
  product.priceGross + variantSurcharge[variant]

/* ── Journal ───────────────────────────────────────────────────────────── */

export type ArticleCategory = 'rom' | 'materialer' | 'mennesker'

export type Article = {
  slug: string
  category: ArticleCategory
  /** «Rom · 5 min lesetid» */
  meta: string
  title: string
  lead: string
  image: string
  alt: string
}

export const articleCategories: { value: ArticleCategory | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'rom', label: 'Rom' },
  { value: 'materialer', label: 'Materialer' },
  { value: 'mennesker', label: 'Mennesker' },
]

export const articles: Article[] = [
  {
    slug: 'lyset-som-far-bli',
    category: 'rom',
    meta: 'Rom · 5 min lesetid',
    title: 'Lyset som får bli.',
    lead: 'Om rommene vi vender tilbake til, og hvorfor de sjelden er de største.',
    image: image('gardsrom'),
    alt: 'Gårdsrom i ettermiddagslys — AI-generert materialstudie',
  },
  {
    slug: 'eik-taler-a-bli-sett',
    category: 'materialer',
    meta: 'Materialer · 4 min lesetid',
    title: 'Eik tåler å bli sett.',
    lead: 'Et besøk hos snekkeren i Østfold som oljer alt for hånd.',
    image: image('materialer'),
    alt: 'Eik og lin — AI-generert materialstudie',
  },
  {
    slug: 'hun-som-lager-skalene',
    category: 'mennesker',
    meta: 'Mennesker · 7 min lesetid',
    title: 'Hun som lager skålene.',
    lead: 'Tre dager i verkstedet til keramikeren bak Morgenritual.',
    image: image('ritual'),
    alt: 'Keramikk — AI-generert materialstudie',
  },
  {
    slug: 'et-hjorne-til-a-lese-i',
    category: 'rom',
    meta: 'Rom · 3 min lesetid',
    title: 'Et hjørne til å lese i.',
    lead: 'Det trengs ikke mer enn en stol, et pledd og lys fra riktig side.',
    image: image('lesestund'),
    alt: 'Lesestund — AI-generert materialstudie',
  },
  {
    slug: 'lin-vasket-tre-ganger',
    category: 'materialer',
    meta: 'Materialer · 5 min lesetid',
    title: 'Lin, vasket tre ganger.',
    lead: 'Hvorfor vi vasker stoffet før det blir til noe.',
    image: image('tekstil'),
    alt: 'Lin — AI-generert materialstudie',
  },
]

export const articleBySlug = (slug: string): Article | undefined =>
  articles.find((a) => a.slug === slug)

/* ── Innhold som ellers ville ligget i Payload ──────────────────────────── */

export type Disclosure = { title: string; content: string }

export const productInfo: Disclosure[] = [
  {
    title: 'Materiale og pleie',
    content: 'Steingods, eik og lin. Vaskes for hånd. Eik oljes etter behov.',
  },
  { title: 'Levering', content: 'Sendes fra Hamar innen to virkedager. Fri frakt over 1 500,–.' },
  { title: 'Retur', content: '30 dagers åpen retur. Du dekker returporto.' },
]

export const faq: Disclosure[] = [
  {
    title: 'Hvor lages tingene?',
    content: 'Alt tegnes i Hamar og produseres hos verksteder i Telemark, Østfold og Normandie.',
  },
  { title: 'Hvor lang er leveringstiden?', content: '3–5 dager i Norge. Vi sender med Posten.' },
  { title: 'Kan jeg returnere?', content: 'Ja, innen 30 dager. Varen må være ubrukt.' },
]

export const sortOptions = [
  { value: 'new', label: 'Nyeste' },
  { value: 'low', label: 'Pris, lav–høy' },
  { value: 'high', label: 'Pris, høy–lav' },
]
