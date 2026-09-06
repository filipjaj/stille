/**
 * Pakker et rendret e-postfragment i et fullt HTML-dokument.
 *
 * `renderToStaticMarkup` gir bare fragmentet. E-post trenger mer enn en
 * nettside gjør, og mindre av det man er vant til:
 *
 * - **Doctype og charset.** Uten dem gjetter klientene, og norske tegn blir
 *   til spørsmålstegn hos noen av dem.
 * - **Preheader.** Teksten innboksen viser som forhåndsvisning etter emnet.
 *   Uten en egen preheader plukker klienten den første teksten den finner —
 *   ofte «Se ordren» eller en avmeldingslenke. Den skjules i selve e-posten
 *   med en kombinasjon av triks som virker på tvers av klienter, og polstres
 *   med usynlige tegn så ikke resten av brødteksten lekker inn i snippeten.
 * - **MSO-blokk.** Outlook bruker Words rendermotor. Den trenger eksplisitt
 *   beskjed om å ikke skalere bilder og å bruke ekte skrifttyper.
 * - **`-webkit-text-size-adjust`.** iOS forstørrer ellers små tekster på egen
 *   hånd og bryter kolonnebredder.
 *
 * Fragmentet renses også: React 19 løfter ut ressurshint — typisk
 * `<link rel="preload" as="image">` for hvert bilde — og legger dem først i
 * markupen. På nett er de en optimalisering. I e-post er de søppel som havner
 * utenfor tabellen, og noen klienter viser dem som tom plass øverst i
 * meldingen.
 */
export function emailDocument({
  title,
  preheader,
  body,
}: {
  title: string
  preheader: string
  body: string
}): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nb">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(title)}</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style>
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table { border-collapse: collapse; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  a { color: #2F2B23; }
</style>
</head>
<body style="margin:0;padding:0;background:#F5F3EB;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(
    preheader,
  )}${'&#8199;&#65279;&#847; '.repeat(30)}</div>
${stripResourceHints(body)}
</body>
</html>`
}

/**
 * Fjerner `<link>` og `<script>` fra et rendret fragment.
 *
 * E-post har verken bruk for eller støtte for noen av delene, og React setter
 * inn `<link>` uoppfordret.
 */
function stripResourceHints(body: string): string {
  return body.replace(/<link\b[^>]*>/gi, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
}

/**
 * Gjør en URL absolutt.
 *
 * En e-post har ingen base-URL. `/api/media/file/x.jpg` — som er det Payload
 * gir oss — blir et brutt bilde i enhver e-postklient. Alt som skal vises må
 * peke på et fullt domene.
 */
export function absoluteUrl(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  if (!base) return undefined
  return `${base.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

/** Minimal escaping for verdiene vi selv setter inn i dokumentrammen. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
