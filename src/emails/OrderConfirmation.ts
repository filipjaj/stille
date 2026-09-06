import { escapeHtml } from './document'

/**
 * Ordrebekreftelse på e-post, portert fra designprosjektets
 * «E-post ordrebekreftelse.dc.html».
 *
 * Tabellbasert layout med inline-stiler, 600px bred. Det ser gammeldags ut,
 * men er fortsatt det eneste som rendrer likt i Outlook, Gmail og Apple Mail —
 * e-postklienter støtter verken flexbox, grid eller eksterne stilark.
 *
 * **Hvorfor strenger og ikke JSX.** Malen var først en React-komponent rendret
 * med `renderToStaticMarkup`. Tre grunner til at den ikke er det lenger:
 *
 * 1. Next tillater ikke `react-dom/server` i modulgrafen sin, og denne malen
 *    kalles fra betalingsflyten — som ligger i den grafen. Bygget feiler.
 * 2. React 19 løfter ut ressurshint (`<link rel="preload">`) for hvert bilde og
 *    legger dem foran markupen. I e-post er de søppel utenfor tabellen.
 * 3. En e-post er en streng, ikke et komponenttre. Ingenting her er
 *    interaktivt, ingenting hydreres, og React-laget la bare til et sett med
 *    egne regler for hvordan stiler serialiseres — oppå e-postklientenes.
 *
 * Fargene og fontene er skrevet ut som verdier, ikke tokens: CSS-variabler
 * fungerer ikke i e-post. De speiler designsystemet og må oppdateres her hvis
 * paletten endres.
 */

const INK = '#2F2B23'
const PAPER = '#FFFEF2'
const SURFACE = '#F5F3EB'
const LINE = '#E1DCCB'
const MUTED = '#6B665B'
const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = 'Helvetica, Arial, sans-serif'

export type OrderConfirmationLine = {
  title: string
  /** «1 stk» */
  meta: string
  /** Ferdig formatert, f.eks. «640,–». */
  sum: string
  /** Må være absolutt — en e-post har ingen base-URL. */
  imageUrl?: string
}

export type OrderConfirmationProps = {
  firstName: string
  orderNo: string
  lines: OrderConfirmationLine[]
  subtotal: string
  shipping: string
  total: string
  deliveryName: string
  deliveryAddress: string[]
  orderUrl: string
}

/** En vareline. Uten bilde står cellen som sandflate — bedre enn et brutt ikon. */
function itemRow(line: OrderConfirmationLine): string {
  const cell = `padding:24px 0;border-bottom:1px solid ${LINE};vertical-align:top`
  const media = line.imageUrl
    ? `<img src="${escapeHtml(line.imageUrl)}" width="88" height="110" alt="" style="display:block;width:88px;height:110px;object-fit:cover" />`
    : `<div style="width:88px;height:110px;background:${SURFACE}"></div>`

  return `<tr>
<td width="88" style="padding:24px 16px 24px 0;border-bottom:1px solid ${LINE};vertical-align:top">${media}</td>
<td style="${cell}">
<p style="font-family:${SERIF};font-size:20px;line-height:24px;font-weight:400;margin:0;color:${INK}">${escapeHtml(line.title)}</p>
<p style="font-family:${SANS};font-size:14px;line-height:21px;margin:6px 0 0;color:${MUTED}">${escapeHtml(line.meta)}</p>
</td>
<td align="right" style="${cell};font-family:${SANS};font-size:16px;line-height:24px;color:${INK};white-space:nowrap">${escapeHtml(line.sum)}</td>
</tr>`
}

/** En rad i summeringen. */
function totalRow(label: string, value: string, emphasis = false): string {
  const cell = emphasis
    ? `padding:20px 0 0;border-top:1px solid ${LINE};font-size:20px`
    : 'padding:6px 0'
  return `<tr><td style="${cell}">${escapeHtml(label)}</td><td align="right" style="${cell}">${escapeHtml(value)}</td></tr>`
}

/** En kolonne i leveringsboksen. */
function infoColumn(heading: string, rows: string[]): string {
  return `<td width="50%" style="padding:24px;vertical-align:top;font-family:${SANS};font-size:14px;line-height:22px;color:${INK}">
<span style="display:block;font-size:12px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">${escapeHtml(heading)}</span>
${rows.map(escapeHtml).join('<br />')}
</td>`
}

export function orderConfirmation({
  firstName,
  orderNo,
  lines,
  subtotal,
  shipping,
  total,
  deliveryName,
  deliveryAddress,
  orderUrl,
}: OrderConfirmationProps): string {
  return `<div style="background:${SURFACE};padding:32px 16px;font-family:${SANS};color:${INK}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" bgcolor="${PAPER}" style="width:600px;max-width:100%;margin:0 auto;background:${PAPER};border-collapse:collapse">
<tr>
<td style="padding:32px 40px 24px;border-bottom:1px solid ${LINE}">
<span style="font-family:${SERIF};font-size:40px;line-height:36px;font-weight:400;letter-spacing:-.05em;color:${INK}">stille</span>
</td>
</tr>

<tr>
<td style="padding:40px 40px 0">
<span style="display:block;font-family:${SANS};font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:.04em;color:${INK}">Ordrebekreftelse · ${escapeHtml(orderNo)}</span>
<h1 style="font-family:${SERIF};font-size:36px;line-height:40px;font-weight:400;letter-spacing:-.02em;margin:16px 0 0;color:${INK}">Takk, ${escapeHtml(firstName)}.</h1>
<p style="font-family:${SANS};font-size:16px;line-height:26px;margin:16px 0 0;color:${INK}">Vi har mottatt bestillingen din og gjør den klar for sending. Du får en ny e-post når pakken er på vei.</p>
</td>
</tr>

<tr>
<td style="padding:40px 40px 0">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-top:1px solid ${LINE}">
${lines.map(itemRow).join('\n')}
</table>
</td>
</tr>

<tr>
<td style="padding:24px 40px 0">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;font-family:${SANS};font-size:16px;line-height:24px;color:${INK}">
${totalRow('Delsum', subtotal)}
${totalRow('Frakt', shipping)}
${totalRow('Total', total, true)}
</table>
</td>
</tr>

<tr>
<td style="padding:40px 40px 0">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${SURFACE}">
<tr>
${infoColumn('Leveres til', [deliveryName, ...deliveryAddress])}
${infoColumn('Levering', ['Posten, hjem', 'Sendes fra Hamar · 3–5 dager'])}
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:32px 40px 48px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="background:#333333;border:1px solid #333333">
<a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:13px 24px;font-family:${SANS};font-size:14px;line-height:21px;color:${PAPER};text-decoration:none">Se ordren &nbsp;&rarr;</a>
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:32px 40px 40px;border-top:1px solid ${LINE};font-family:${SANS};font-size:12px;line-height:19px;color:${MUTED}">
<span style="display:block;font-family:${SERIF};font-size:28px;line-height:25px;font-weight:400;letter-spacing:-.05em;color:${INK};margin-bottom:16px">stille</span>
Et nytt uttrykk, med et tydelig opphav.<br />
Spørsmål? Svar på denne e-posten.
</td>
</tr>
</table>
</div>`
}
