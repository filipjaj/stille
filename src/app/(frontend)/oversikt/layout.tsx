import React from 'react'

import '@/styles/stille/tokens.css'
import '@/styles/stille/components.css'

/**
 * Slår på Stille-designsystemet for denne ruta. `.st` bærer grunnflaten,
 * typografien og fokusringen; token-fila setter også html-bakgrunnen, siden
 * Payload-malens styles.css ellers gir svart side.
 */
export default function OversiktLayout({ children }: { children: React.ReactNode }) {
  return <div className="st">{children}</div>
}
