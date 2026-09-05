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

/**
 * Seeder Payload med innholdet fra designprosjektets prototyper.
 *
 * Kjøringen er idempotent hele veien: hvert dokument slås opp på et unikt felt
 * før det opprettes. Å kjøre seed to ganger gir ingen duplikater, og en
 * avbrutt kjøring kan gjenopptas — noe som betyr mer enn vanlig her, siden D1
 * ikke gir oss transaksjoner å rulle tilbake med.
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
      categoryIds.set(category.title, existing.docs[0].id)
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
    if (existing.totalDocs > 0) {
      productIds.set(product.slug, existing.docs[0].id)
      continue
    }

    const imageId = await imageFor(product.image, `${product.title} — AI-generert materialstudie`)

    const created = await payload.create({
      collection: 'products',
      data: {
        title: product.title,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        priceInNOK: product.priceGross,
        vatRate: String(product.vatRate) as '25' | '15' | '12' | '0',
        inventory: 12,
        category: categoryIds.get(product.category),
        lookbook: lookbookId,
        images: imageId ? [{ image: imageId }] : [],
        _status: 'published',
      },
    })
    productIds.set(product.slug, created.id)
    log(`Opprettet produkt ${product.slug}`)
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
