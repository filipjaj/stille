import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    /**
     * Node, ikke jsdom.
     *
     * Payload-konfigurasjonen drar inn wrangler, som bruker esbuild. esbuild
     * nekter å kjøre i jsdom fordi `new TextEncoder().encode('') instanceof
     * Uint8Array` er false der, og enhver test som rører Payload feiler med
     * «Invariant violation» før den kommer i gang.
     *
     * Ingen av testene i dag trenger en DOM. Kommer det komponenttester,
     * setter de `// @vitest-environment jsdom` øverst i sin egen fil.
     */
    environment: 'node',

    /**
     * Én testfil om gangen.
     *
     * Integrasjonstestene åpner hver sin Payload-instans mot den samme lokale
     * D1-fila. Kjøres de parallelt, låser de hverandre ute med
     * «SQLITE_BUSY: database is locked» — samme grunn til at bygget kjører med
     * én worker. Suiten er liten nok til at kostnaden er ubetydelig.
     */
    fileParallelism: false,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts', 'src/**/*.spec.ts'],
  },
})
