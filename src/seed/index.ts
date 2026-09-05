import { randomBytes } from 'crypto'
import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

import { articles, faq, products, productInfo } from './content'

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'

/**
 * Passordet må komme utenfra, eller genereres tilfeldig.
 *
 * En boilerplate med et fast standardpassord i kildekoden er et innbrudd som
 * venter på å skje: repoet blir klonet og deployet, og passordet er kjent av
 * alle som har sett fila. Er `SEED_ADMIN_PASSWORD` ikke satt, lager vi et
 * tilfeldig ett og skriver det ut én gang.
 */
function resolveAdminPassword(): { password: string; generated: boolean } {
  const fromEnv = process.env.SEED_ADMIN_PASSWORD
  if (fromEnv) return { password: fromEnv, generated: false }
  return { password: randomBytes(24).toString('base64url'), generated: true }
}

const IMAGE_DIR = path.resolve(process.cwd(), 'public/images')

/** Pleieteksten er felles for alle demoproduktene, som i prototypen. */
const PRODUCT_CARE = 'Steingods, eik og lin. Vaskes for hånd. Eik oljes etter behov.'

/**
 * Minimal gyldig Lexical-struktur fra rene avsnitt.
 *
 * Payload lagrer rik tekst som Lexical-JSON. Seed skriver den for hånd i
 * stedet for å dra inn en editor-avhengighet bare for å fylle demoinnhold.
 */
function lexical(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [
          {
            type: 'text',
            text,
            format: 0,
            style: '',
            mode: 'normal',
            detail: 0,
            version: 1,
          },
        ],
      })),
    },
  }
}

/**
 * Seeder Payload med innholdet fra designprosjektets prototyper.
 *
 * Kjøringen konvergerer: hvert dokument slås opp på et unikt felt, og
 * oppdateres hvis det finnes fra før. Å bare hoppe over eksisterende
 * dokumenter var feil — da nådde en ny feltverdi aldri fram til allerede
 * seedede rader, og seed-en sluttet å beskrive den tilstanden den lover.
 *
 * Det betyr også at seed overskriver lokale endringer på de dokumentene den
 * eier. Det er tilsiktet: dette er demoinnhold, ikke redaksjonelt arbeid.
 *
 * Bilder: filene ligger ikke i repoet ennå (design-API-et kutter nedlastinger
 * på 192 kB). Seed oppretter mediedokumenter for de PNG-ene som faktisk
 * finnes i public/images/, og hopper over resten. Legger du filene inn senere
 * og kjører seed på nytt, kobles de opp uten at noe annet røres.
 */
export async function seed(payload: Payload): Promise<void> {
  const log = (msg: string) => payload.logger.info(msg)

  /* ── Administrator ──────────────────────────────────────────────────── */
  const existingAdmin = await payload.find({
    collection: 'users',
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  })

  if (existingAdmin.totalDocs === 0) {
    const { password, generated } = resolveAdminPassword()
    await payload.create({
      collection: 'users',
      data: { email: ADMIN_EMAIL, password, roles: ['admin'] },
    })
    log(`Opprettet administrator ${ADMIN_EMAIL}`)
    if (generated) {
      payload.logger.warn(
        `Passordet ble generert siden SEED_ADMIN_PASSWORD ikke var satt. ` +
          `Logg inn med dette og bytt det med en gang — det skrives ikke ut igjen:\n\n    ${password}\n`,
      )
    }
  } else {
    // Seed eskalerer aldri en eksisterende bruker til administrator. En konto
    // som allerede finnes kan tilhøre en kunde, og å gi den admin-rettigheter
    // fordi e-posten tilfeldigvis matcher SEED_ADMIN_EMAIL ville vært en
    // rettighetseskalering utløst av en miljøvariabel.
    const admin = existingAdmin.docs[0]
    if (!admin.roles?.includes('admin')) {
      payload.logger.warn(
        `Brukeren ${ADMIN_EMAIL} finnes allerede, men mangler admin-rollen. ` +
          'Seed endrer ikke rettigheter på eksisterende kontoer. ' +
          'Gi rollen manuelt i adminen, eller sett SEED_ADMIN_EMAIL til en ubrukt adresse.',
      )
    } else {
      log(`Administrator ${ADMIN_EMAIL} finnes allerede`)
    }
  }

  /* ── Media ──────────────────────────────────────────────────────────── */
  const mediaByFile = new Map<string, number>()

  /** Oppretter ett mediedokument per PNG som finnes på disk. */
  const ensureMedia = async (imagePath: string, alt: string): Promise<number | undefined> => {
    const filename = path.basename(imagePath)
    const cached = mediaByFile.get(filename)
    if (cached) return cached

    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })
    if (existing.totalDocs > 0) {
      const id = existing.docs[0].id
      mediaByFile.set(filename, id)
      return id
    }

    const onDisk = path.join(IMAGE_DIR, filename)
    if (!fs.existsSync(onDisk)) return undefined

    const created = await payload.create({
      collection: 'media',
      data: { alt },
      filePath: onDisk,
    })
    mediaByFile.set(filename, created.id)
    log(`Lastet opp ${filename}`)
    return created.id
  }

  const missingImages: string[] = []
  const imageFor = async (imagePath: string, alt: string): Promise<number | undefined> => {
    const id = await ensureMedia(imagePath, alt)
    if (!id) missingImages.push(path.basename(imagePath))
    return id
  }

  /* ── Kategorier ─────────────────────────────────────────────────────── */
  const categoryIds = new Map<string, number>()
  const categorySeed = [
    { title: 'Objekter', slug: 'objekter', intro: 'Steingods og keramikk til daglig bruk.' },
    { title: 'Tekstil', slug: 'tekstil', intro: 'Lin og ull, vevd for å vare.' },
    { title: 'Materialer', slug: 'materialer', intro: 'Eik fra Østfold, oljet for hånd.' },
  ]

  for (const category of categorySeed) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: category.slug } },
      limit: 1,
    })
    if (existing.totalDocs > 0) {
      const id = existing.docs[0].id
      await payload.update({ collection: 'categories', id, data: category })
      categoryIds.set(category.title, id)
      continue
    }
    const created = await payload.create({ collection: 'categories', data: category })
    categoryIds.set(category.title, created.id)
    log(`Opprettet kategori ${category.slug}`)
  }

  /* ── Lookbook ───────────────────────────────────────────────────────── */
  let lookbookId: number | undefined
  const existingLookbook = await payload.find({
    collection: 'lookbooks',
    where: { slug: { equals: 'host-2026' } },
    limit: 1,
  })
  if (existingLookbook.totalDocs > 0) {
    lookbookId = existingLookbook.docs[0].id
  } else {
    const created = await payload.create({
      collection: 'lookbooks',
      data: {
        title: 'Lyset i oktober.',
        slug: 'host-2026',
        season: 'Høst 2026',
        intro:
          'Ni objekter for de korte dagene. Fotografert i et hus ved Mjøsa over to ettermiddager.',
      },
    })
    lookbookId = created.id
    log('Opprettet lookbook host-2026')
  }

  /* ── Produkter ──────────────────────────────────────────────────────── */
  const productIds = new Map<string, number>()

  for (const product of products) {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: product.slug } },
      limit: 1,
    })
    const imageId = await imageFor(product.image, `${product.title} — AI-generert materialstudie`)

    const data = {
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      care: PRODUCT_CARE,
      priceInNOK: product.priceGross,
      vatRate: String(product.vatRate) as '25' | '15' | '12' | '0',
      inventory: 12,
      category: categoryIds.get(product.category),
      lookbook: lookbookId,
      images: imageId ? [{ image: imageId }] : [],
      _status: 'published' as const,
    }

    if (existing.totalDocs > 0) {
      const id = existing.docs[0].id
      await payload.update({ collection: 'products', id, data })
      productIds.set(product.slug, id)
      log(`Oppdaterte produkt ${product.slug}`)
    } else {
      const created = await payload.create({ collection: 'products', data })
      productIds.set(product.slug, created.id)
      log(`Opprettet produkt ${product.slug}`)
    }
  }

  /* ── FAQ ────────────────────────────────────────────────────────────── */
  for (const [index, item] of faq.entries()) {
    const existing = await payload.find({
      collection: 'faqs',
      where: { question: { equals: item.title } },
      limit: 1,
    })
    if (existing.totalDocs > 0) continue
    await payload.create({
      collection: 'faqs',
      data: { question: item.title, answer: item.content, order: index + 1 },
    })
  }
  log(`FAQ: ${faq.length} spørsmål`)

  /* ── Artikler ───────────────────────────────────────────────────────── */
  for (const article of articles) {
    const existing = await payload.find({
      collection: 'articles',
      where: { slug: { equals: article.slug } },
      limit: 1,
    })
    if (existing.totalDocs > 0) continue

    const heroId = await imageFor(article.image, article.alt)
    if (!heroId) {
      log(`Hopper over artikkel ${article.slug} — hero-bildet mangler`)
      continue
    }

    await payload.create({
      collection: 'articles',
      data: {
        title: article.title,
        slug: article.slug,
        lead: article.lead,
        category: article.category,
        readingTime: Number(article.meta.match(/(\d+) min/)?.[1] ?? 5),
        hero: { image: heroId, alt: article.alt },
        featured: article.slug === articles[0].slug,
        publishedAt: new Date().toISOString(),
        _status: 'published',
      },
    })
    log(`Opprettet artikkel ${article.slug}`)
  }

  /* ── Looks i lookbooken ─────────────────────────────────────────────── */
  /*
   * Bildeserien fra lerretet. `looks[].image` er påkrevd, så et look kan bare
   * opprettes når bildefila finnes. Blokka kjøres derfor på nytt ved hver seed
   * og fyller inn de looksene som lar seg lage — legger du bildene inn senere,
   * dukker serien opp uten at noe annet røres.
   */
  if (lookbookId) {
    const current = await payload.findByID({ collection: 'lookbooks', id: lookbookId, depth: 0 })
    if ((current.looks ?? []).length === 0) {
      const lookSeed = [
        {
          image: '/images/stille-lesestund.png',
          alt: 'Lesestund — AI-generert materialstudie',
          caption: '01 — Ettermiddag. Ullpledd og keramikk i vinduskarmen.',
          products: ['pledd-i-ull', 'morgenritual'],
        },
        {
          image: '/images/stille-materialer.png',
          alt: 'Eik og lin — AI-generert materialstudie',
          caption: '02 — Eik, oljet. Lin, vasket tre ganger.',
          products: ['eik-i-hverdagen', 'lys-gjennom-lin'],
        },
      ]

      const looks = []
      for (const look of lookSeed) {
        const imageId = await imageFor(look.image, look.alt)
        if (!imageId) continue
        looks.push({
          image: imageId,
          caption: look.caption,
          products: look.products
            .map((slug) => productIds.get(slug))
            .filter((id): id is number => typeof id === 'number'),
        })
      }

      if (looks.length > 0) {
        await payload.update({ collection: 'lookbooks', id: lookbookId, data: { looks } })
        log(`La til ${looks.length} looks i host-2026`)
      } else {
        log('Hopper over looks i host-2026 — bildene mangler')
      }
    }
  }

  /* ── Sider ──────────────────────────────────────────────────────────── */
  /*
   * «Om oss» er lerretets eksempel på en side bygget av blokker. Hero- og
   * imageText-blokkene krever bilde, så de utelates til filene er lagt inn —
   * resten av blokktypene fungerer uten, og siden blir dermed en ekte prøve
   * på blokk-rendringen fra dag én.
   */
  const faqDocs = await payload.find({ collection: 'faqs', limit: 10, sort: 'order' })
  const existingPage = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'om-oss' } },
    limit: 1,
  })

  if (existingPage.totalDocs === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- blokk-unionen
    // er generert per blokktype; en heterogen literal-array treffer den ikke uten
    // en cast, og hver blokk er verifisert mot sin egen definisjon i src/blocks/.
    const layout: any[] = [
      {
        blockType: 'richText',
        body: lexical([
          'Stille startet i 2021 som et lite verksted i Hamar. Vi lager få ting, og vi lager dem lenge. Hvert objekt tegnes her, produseres hos verksteder vi kjenner ved navn, og selges bare gjennom oss.',
          'Vi tror ikke på sesonger. Vi tror på ting som får bli.',
        ]),
      },
      {
        blockType: 'quote',
        quote: 'Vi lager ikke ting for å fylle rom. Vi lager ting rommet kan hvile i.',
      },
    ]

    if (faqDocs.totalDocs > 0) {
      layout.push({
        blockType: 'faq',
        title: 'Ofte spurt',
        faqs: faqDocs.docs.map((f) => f.id),
      })
    }

    layout.push({
      blockType: 'newsletter',
      eyebrow: 'Nyhetsbrev',
      title: 'Et brev i måneden. Sjelden mer.',
      buttonLabel: 'Meld meg på',
    })

    await payload.create({
      collection: 'pages',
      data: {
        title: 'Et nytt uttrykk, med opphav.',
        slug: 'om-oss',
        layout,
        navPlacement: 'both',
        _status: 'published',
      },
    })
    log(`Opprettet siden om-oss med ${layout.length} blokker`)
  }

  /* ── Globals ────────────────────────────────────────────────────────── */
  await payload.updateGlobal({
    slug: 'shop',
    data: {
      shippingCost: 7900,
      freeShippingThreshold: 150000,
      paymentMethods: ['vipps', 'card', 'klarna'],
    },
  })

  await payload.updateGlobal({
    slug: 'header',
    data: {
      nav: [
        { label: 'Samlingen', type: 'external', url: '/samlingen' },
        { label: 'Høst 2026', type: 'external', url: '/samlinger/host-2026' },
        { label: 'Journal', type: 'external', url: '/journal' },
        { label: 'Om oss', type: 'external', url: '/sider/om-oss' },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    data: {
      text: 'Et nytt uttrykk, med et tydelig opphav.',
      links: [
        { label: 'Om oss', type: 'external', url: '/sider/om-oss' },
        { label: 'Levering og retur', type: 'external', url: '/sider/levering-og-retur' },
        { label: 'Konto', type: 'external', url: '/konto' },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'frontpage',
    data: {
      eyebrow: 'Samling / 01',
      title: 'Rom for det',
      titleItalic: 'vesentlige.',
      lead: 'Objekter og fortellinger med plass til hverdagen.',
    },
  })

  await payload.updateGlobal({
    slug: 'newsletter',
    data: {
      eyebrow: 'Nyhetsbrev',
      title: 'Et brev i måneden. Sjelden mer.',
      buttonLabel: 'Meld meg på',
    },
  })
  log('Globals satt')

  /* ── Oppsummering ───────────────────────────────────────────────────── */
  if (missingImages.length > 0) {
    const unique = [...new Set(missingImages)]
    payload.logger.warn(
      `${unique.length} bilder mangler i public/images/ og ble hoppet over: ${unique.join(', ')}. ` +
        'Legg dem inn og kjør seed på nytt for å koble dem opp — se Handoff-oppgaven ' +
        'task-2026-09-05-stille-bilder.',
    )
  }

  // productInfo hører til produktsidene og legges inn når blokk-innholdet
  // seedes i milepæl 6; referansen her holder importen ærlig.
  void productInfo
}
