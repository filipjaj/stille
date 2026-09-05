// dotenv må lastes før payload.config leses — CLI-en gjør dette selv, men
// tsx gjør det ikke, og konfigurasjonen krever PAYLOAD_SECRET ved init.
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '@/payload.config'

import { seed } from './index'

const payload = await getPayload({ config: await config })
await seed(payload)
process.exit(0)
