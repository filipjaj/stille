import type { Field } from 'payload'

/**
 * MVA-sats per produkt. Payload lagrer select-verdier som strenger; bruk
 * `toVatRate` fra src/money når verdien skal regnes med.
 */
export const vatRateField: Field = {
  name: 'vatRate',
  type: 'select',
  required: true,
  defaultValue: '25',
  label: 'MVA-sats',
  options: [
    { label: '25 % — standardsats', value: '25' },
    { label: '15 % — næringsmidler', value: '15' },
    { label: '12 % — persontransport, overnatting, kino', value: '12' },
    { label: '0 % — bøker, aviser, tidsskrifter', value: '0' },
  ],
  admin: {
    position: 'sidebar',
  },
}
