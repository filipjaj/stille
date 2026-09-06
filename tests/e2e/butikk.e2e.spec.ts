import { expect, test, type Page } from '@playwright/test'

/**
 * Kjøpsreisen gjennom butikken.
 *
 * Enhetstestene dekker regnestykkene (`src/money`) og webhooken dekker
 * betalingen. Det ingen av dem kan svare på er om tallene faktisk møtes på
 * skjermen: om fraktregelen fra `shop`-globalen når `calculateTotals` med
 * riktige argumenter, og om summen brukeren ser er den samme summen som
 * sendes til betaling.
 *
 * Testene her kjører derfor mot ekte data fra Payload. De forutsetter at
 * `pnpm run seed` har kjørt — uten demoinnhold finnes ingen produkter å
 * legge i kurven.
 */

const BASE = 'http://localhost:3000'

/** Fra seed-en: `shop.shippingCost` 79,– og fri frakt over 1 500,–. */
const SHIPPING = '79,–'
const FREE_SHIPPING_FROM = 150000

/** Fra seed-en. Ett kjøp av dette havner under fraktgrensen, tre over. */
const PRODUCT = {
  slug: 'keramikk-og-lin',
  title: 'Keramikk og lin',
  price: '640,–',
  priceOre: 64000,
}

/**
 * Legger produktet i kurven fra produktsiden og venter på bekreftelsen.
 *
 * Produktsiden viser også relaterte produkter, og hvert kort har sin egen
 * «Legg i kurven». Hovedknappen er den eneste `st-button` — kortene bruker
 * `st-text-link`.
 */
async function addToCart(page: Page): Promise<void> {
  await page.goto(`${BASE}/produkt/${PRODUCT.slug}`)
  await page.locator('button.st-button', { hasText: 'Legg i kurven' }).click()
  await expect(page.locator('button.st-button', { hasText: 'Lagt i kurven' })).toBeVisible()
}

/** Leser et beløp ut av oppsummeringen, f.eks. `summaryValue(page, 'Frakt')`. */
function summaryValue(page: Page, label: string) {
  return page
    .locator('div', { has: page.locator(`span:text-is("${label}")`) })
    .last()
    .locator('span')
    .last()
}

test.describe('butikkflatene leser fra Payload', () => {
  test('forsiden viser innholdet fra frontpage-globalen', async ({ page }) => {
    await page.goto(BASE)

    // Tittelen er delt i to felt i Payload — `title` og `titleItalic`.
    await expect(page.locator('h1')).toContainText('Rom for det')
    await expect(page.locator('h1 em')).toContainText('vesentlige.')

    // Forsidebildet er et mediedokument, ikke en fil i public/.
    await expect(page.locator('img[src*="/api/media/file/"]').first()).toBeVisible()
  })

  test('produktsiden viser tittel og pris fra produktet', async ({ page }) => {
    await page.goto(`${BASE}/produkt/${PRODUCT.slug}`)

    await expect(page.locator('h1')).toHaveText(PRODUCT.title)
    await expect(page.getByText(PRODUCT.price, { exact: true }).first()).toBeVisible()
  })

  test('samlingen lister produktene', async ({ page }) => {
    await page.goto(`${BASE}/samlingen`)

    await expect(page.getByRole('link', { name: new RegExp(PRODUCT.title) }).first()).toBeVisible()
  })
})

/*
 * Kurven trenger ingen opprydding mellom testene: kurv-id-en ligger i
 * localStorage, og Playwright gir hver test en fersk browserkontekst. Hver
 * test starter derfor med tom kurv uten at vi gjør noe.
 */
test.describe('kurven', () => {
  test('en tom kurv sier at den er tom', async ({ page }) => {
    await page.goto(`${BASE}/kurv`)

    await expect(page.getByText('Kurven er tom.')).toBeVisible()
  })

  test('et produkt lagt i kurven dukker opp med riktig pris', async ({ page }) => {
    await addToCart(page)
    await page.goto(`${BASE}/kurv`)

    await expect(page.getByRole('heading', { name: PRODUCT.title })).toBeVisible()
    await expect(summaryValue(page, 'Delsum')).toHaveText(PRODUCT.price)
  })

  /**
   * Selve poenget med denne fila.
   *
   * `calculateTotals` er enhetstestet, og `resolveShipping` er én linje. Men
   * fraktgrensen leses fra `shop`-globalen, sendes gjennom en serverkomponent
   * som props, og treffer regnestykket i en klientkomponent. Hvert av leddene
   * kan være riktig hver for seg og likevel gi feil tall på skjermen — og
   * frakt er det brukeren klager på først.
   */
  test('fraktgrensen slår inn når delsummen passerer 1 500,–', async ({ page }) => {
    await addToCart(page)
    await page.goto(`${BASE}/kurv`)

    // Ett stykk: 640,– er under grensen, så frakten skal koste.
    await expect(summaryValue(page, 'Delsum')).toHaveText(PRODUCT.price)
    await expect(summaryValue(page, 'Frakt')).toHaveText(SHIPPING)

    // Opp til tre stykk: 1 920,– passerer grensen.
    const increase = page.getByRole('button', { name: 'Øk' })
    await increase.click()
    await expect(summaryValue(page, 'Delsum')).toHaveText('1 280,–')
    await expect(summaryValue(page, 'Frakt')).toHaveText(SHIPPING)

    await increase.click()
    await expect(summaryValue(page, 'Delsum')).toHaveText('1 920,–')
    await expect(summaryValue(page, 'Frakt')).toHaveText('Fri')

    // Grensen er «over», ikke «fra og med» — kontrollregn mot konstanten.
    expect(PRODUCT.priceOre * 3).toBeGreaterThanOrEqual(FREE_SHIPPING_FROM)
    expect(PRODUCT.priceOre * 2).toBeLessThan(FREE_SHIPPING_FROM)
  })

  test('totalen er delsum pluss frakt', async ({ page }) => {
    await addToCart(page)
    await page.goto(`${BASE}/kurv`)

    // 640 + 79 = 719.
    await expect(summaryValue(page, 'Totalt')).toHaveText('719,–')
  })

  test('varen kan fjernes igjen', async ({ page }) => {
    await addToCart(page)
    await page.goto(`${BASE}/kurv`)
    await expect(page.getByRole('heading', { name: PRODUCT.title })).toBeVisible()

    await page.getByRole('button', { name: 'Fjern' }).click()

    await expect(page.getByText('Kurven er tom.')).toBeVisible()
  })
})

test.describe('kassen', () => {
  test.beforeEach(async ({ page }) => {
    await addToCart(page)
  })

  test('kassen viser den samme summen som kurven', async ({ page }) => {
    await page.goto(`${BASE}/kurv`)
    const iCart = await summaryValue(page, 'Totalt').innerText()

    await page.getByRole('link', { name: /Til kassen/ }).click()
    await page.waitForURL(`${BASE}/kasse`)

    // Avviker de to, betaler kunden et annet beløp enn hen sa ja til.
    await expect(summaryValue(page, 'Totalt')).toHaveText(iCart)
  })

  test('skjemaet krever kontaktopplysninger før betaling', async ({ page }) => {
    await page.goto(`${BASE}/kasse`)

    await expect(page.locator('input[name="epost"]')).toBeVisible()
    await expect(page.locator('input[name="navn"]')).toBeVisible()
    await expect(page.locator('input[name="epost"]')).toHaveAttribute('required', '')
  })
})
