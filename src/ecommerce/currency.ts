import type { Currency } from '@payloadcms/plugin-ecommerce/types'

/**
 * Norske kroner. `decimals: 2` gjør at plugin-en lagrer priser i øre.
 *
 * Ligger i egen fil, ikke i ecommerce/config.ts, fordi den brukes av
 * klientkomponenten som setter opp kurvkonteksten. Importerer man den fra
 * config-en, drar man samtidig med seg `ecommercePlugin` og dermed Payloads
 * serverkode inn i klientbundelen — som feiler på `fs` og tar ned hele appen.
 */
export const NOK: Currency = {
  code: 'NOK',
  decimals: 2,
  label: 'Norske kroner',
  symbol: 'kr',
  symbolDisplay: 'symbol',
}
