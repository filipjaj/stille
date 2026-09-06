import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { resendAdapter } from '@payloadcms/email-resend'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { WebhookEvents } from './collections/WebhookEvents'
import { Articles } from './collections/Articles'
import { Categories } from './collections/Categories'
import { Faqs } from './collections/Faqs'
import { Lookbooks } from './collections/Lookbooks'
import { Pages } from './collections/Pages'
import { Footer } from './globals/Footer'
import { Frontpage } from './globals/Frontpage'
import { Header } from './globals/Header'
import { Newsletter } from './globals/Newsletter'
import { Shop } from './globals/Shop'
import { migrations } from './migrations'
import { ecommerce } from './ecommerce/config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => {
  try {
    return fs.existsSync(value) ? fs.realpathSync(value) : undefined
  } catch {
    return undefined
  }
}

/**
 * Kjører vi Payloads egen CLI (`payload migrate`), eller Next?
 *
 * Skillet betyr noe: migrasjoner skal treffe den ekte databasen i produksjon,
 * mens et bygg ikke skal snakke med produksjonsdata i det hele tatt.
 */
const isPayloadCLI = process.argv.some(
  (value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')) ?? false,
)
const isNextCLI = process.argv.some(
  (value) => realpath(value)?.endsWith(path.join('next', 'dist', 'bin', 'next')) ?? false,
)
const isCLI = isPayloadCLI || isNextCLI
const isProduction = process.env.NODE_ENV === 'production'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any // Use PayloadLogger type when it's exported

const cloudflare =
  isCLI || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    WebhookEvents,
    // Innholdsmodellen fra designprosjektet. Butikkflatene leser alt herfra —
    // ingen hardkodede data i rutene.
    Categories,
    Lookbooks,
    Articles,
    Faqs,
    Pages,
  ],
  globals: [Header, Footer, Frontpage, Newsletter, Shop],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    prodMigrations: migrations,
    // Dev skal kjøre de samme migrasjonene som prod. Med push (default i dev)
    // synkroniseres skjemaet direkte fra config-en, og migrasjonene testes
    // aldri før deploydagen.
    push: false,
  }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    ecommerce,
  ],
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Nettbutikk',
  }),
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        // Eksterne bindinger slås på eksplisitt, ikke utledet.
        //
        // Bare `deploy:database` skal treffe den ekte databasen. Under
        // `next build` er remote-bindinger både unødvendige og skadelige:
        // bygget krever da Cloudflare-innlogging og feiler i ethvert miljø
        // uten legitimasjon — inkludert en frisk klone av repoet og CI.
        //
        // Flagget er en miljøvariabel og ikke utledet fra `process.argv`, fordi
        // Next kjører sidedatainnsamling i egne worker-prosesser der argv ikke
        // ligner på kommandoen du skrev.
        remoteBindings: process.env.PAYLOAD_REMOTE_BINDINGS === 'true',
      } satisfies GetPlatformProxyOptions),
  )
}
