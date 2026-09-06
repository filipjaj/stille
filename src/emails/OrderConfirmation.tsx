import React from 'react'

import type { Ore } from '@/money'

/**
 * Ordrebekreftelse på e-post, portert fra designprosjektets
 * «E-post ordrebekreftelse.dc.html».
 *
 * Tabellbasert layout med inline-stiler, 600px bred. Det ser gammeldags ut,
 * men er fortsatt det eneste som rendrer likt i Outlook, Gmail og Apple Mail —
 * e-postklienter støtter verken flexbox, grid eller eksterne stilark.
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
  /** «Objekter · 1 stk» */
  meta: string
  /** Ferdig formatert, f.eks. «640,–». */
  sum: string
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

export function OrderConfirmation({
  firstName,
  orderNo,
  lines,
  subtotal,
  shipping,
  total,
  deliveryName,
  deliveryAddress,
  orderUrl,
}: OrderConfirmationProps) {
  return (
    <div style={{ background: SURFACE, padding: '32px 16px', fontFamily: SANS, color: INK }}>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        width={600}
        bgcolor={PAPER}
        style={{
          width: 600,
          maxWidth: '100%',
          margin: '0 auto',
          background: PAPER,
          borderCollapse: 'collapse',
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: '32px 40px 24px', borderBottom: `1px solid ${LINE}` }}>
              <span
                style={{
                  fontFamily: SERIF,
                  fontSize: '40px',
                  lineHeight: '36px',
                  fontWeight: 400,
                  letterSpacing: '-.05em',
                  color: INK,
                }}
              >
                stille
              </span>
            </td>
          </tr>

          <tr>
            <td style={{ padding: '40px 40px 0' }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: SANS,
                  fontSize: '12px',
                  lineHeight: '18px',
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  color: INK,
                }}
              >
                Ordrebekreftelse · {orderNo}
              </span>
              <h1
                style={{
                  fontFamily: SERIF,
                  fontSize: '36px',
                  lineHeight: '40px',
                  fontWeight: 400,
                  letterSpacing: '-.02em',
                  margin: '16px 0 0',
                  color: INK,
                }}
              >
                Takk, {firstName}.
              </h1>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: '16px',
                  lineHeight: '26px',
                  margin: '16px 0 0',
                  color: INK,
                }}
              >
                Vi har mottatt bestillingen din og gjør den klar for sending. Du får en ny e-post
                når pakken er på vei.
              </p>
            </td>
          </tr>

          <tr>
            <td style={{ padding: '40px 40px 0' }}>
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                width="100%"
                style={{ borderCollapse: 'collapse', borderTop: `1px solid ${LINE}` }}
              >
                <tbody>
                  {lines.map((line) => (
                    <tr key={`${line.title}-${line.meta}`}>
                      <td
                        width={88}
                        style={{
                          padding: '24px 16px 24px 0',
                          borderBottom: `1px solid ${LINE}`,
                          verticalAlign: 'top',
                        }}
                      >
                        {/*
                          Mangler bildet, står cellen tom med sandflaten — en
                          ødelagt bildeikon i en kvittering ser verre ut enn
                          ingen bilde.
                        */}
                        {line.imageUrl ? (
                          <img
                            src={line.imageUrl}
                            width={88}
                            alt=""
                            style={{ display: 'block', width: 88, height: 110, objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: 88, height: 110, background: SURFACE }} />
                        )}
                      </td>
                      <td
                        style={{
                          padding: '24px 0',
                          borderBottom: `1px solid ${LINE}`,
                          verticalAlign: 'top',
                        }}
                      >
                        <p
                          style={{
                            fontFamily: SERIF,
                            fontSize: '20px',
                            lineHeight: '24px',
                            fontWeight: 400,
                            margin: 0,
                            color: INK,
                          }}
                        >
                          {line.title}
                        </p>
                        <p
                          style={{
                            fontFamily: SANS,
                            fontSize: '14px',
                            lineHeight: '21px',
                            margin: '6px 0 0',
                            color: MUTED,
                          }}
                        >
                          {line.meta}
                        </p>
                      </td>
                      <td
                        align="right"
                        style={{
                          padding: '24px 0',
                          borderBottom: `1px solid ${LINE}`,
                          verticalAlign: 'top',
                          fontFamily: SANS,
                          fontSize: '16px',
                          lineHeight: '24px',
                          color: INK,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {line.sum}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style={{ padding: '24px 40px 0' }}>
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                width="100%"
                style={{
                  borderCollapse: 'collapse',
                  fontFamily: SANS,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: INK,
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 0' }}>Delsum</td>
                    <td align="right" style={{ padding: '6px 0' }}>
                      {subtotal}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0' }}>Frakt</td>
                    <td align="right" style={{ padding: '6px 0' }}>
                      {shipping}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{ padding: '20px 0 0', borderTop: `1px solid ${LINE}`, fontSize: 20 }}
                    >
                      Total
                    </td>
                    <td
                      align="right"
                      style={{ padding: '20px 0 0', borderTop: `1px solid ${LINE}`, fontSize: 20 }}
                    >
                      {total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style={{ padding: '40px 40px 0' }}>
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                width="100%"
                style={{ borderCollapse: 'collapse', background: SURFACE }}
              >
                <tbody>
                  <tr>
                    <td
                      width="50%"
                      style={{
                        padding: 24,
                        verticalAlign: 'top',
                        fontFamily: SANS,
                        fontSize: '14px',
                        lineHeight: '22px',
                        color: INK,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: 12,
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                          marginBottom: 8,
                        }}
                      >
                        Leveres til
                      </span>
                      {deliveryName}
                      {deliveryAddress.map((row) => (
                        <React.Fragment key={row}>
                          <br />
                          {row}
                        </React.Fragment>
                      ))}
                    </td>
                    <td
                      width="50%"
                      style={{
                        padding: 24,
                        verticalAlign: 'top',
                        fontFamily: SANS,
                        fontSize: '14px',
                        lineHeight: '22px',
                        color: INK,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: 12,
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                          marginBottom: 8,
                        }}
                      >
                        Levering
                      </span>
                      Posten, hjem
                      <br />
                      Sendes fra Hamar · 3–5 dager
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style={{ padding: '32px 40px 48px' }}>
              <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                <tbody>
                  <tr>
                    <td style={{ background: '#333333', border: '1px solid #333333' }}>
                      <a
                        href={orderUrl}
                        style={{
                          display: 'inline-block',
                          padding: '13px 24px',
                          fontFamily: SANS,
                          fontSize: '14px',
                          lineHeight: '21px',
                          color: PAPER,
                          textDecoration: 'none',
                        }}
                      >
                        Se ordren &nbsp;→
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td
              style={{
                padding: '32px 40px 40px',
                borderTop: `1px solid ${LINE}`,
                fontFamily: SANS,
                fontSize: '12px',
                lineHeight: '19px',
                color: MUTED,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: SERIF,
                  fontSize: '28px',
                  lineHeight: '25px',
                  fontWeight: 400,
                  letterSpacing: '-.05em',
                  color: INK,
                  marginBottom: 16,
                }}
              >
                stille
              </span>
              Et nytt uttrykk, med et tydelig opphav.
              <br />
              Spørsmål? Svar på denne e-posten.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/** Beløpene e-posten trenger, alle i øre. */
export type OrderConfirmationAmounts = {
  subtotal: Ore
  shipping: Ore
  total: Ore
}
