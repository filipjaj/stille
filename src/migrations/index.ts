import * as migration_20260905_202054_initial from './20260905_202054_initial'
import * as migration_20260905_204707_legg_til_pleie_og_forside from './20260905_204707_legg_til_pleie_og_forside'

export const migrations = [
  {
    up: migration_20260905_202054_initial.up,
    down: migration_20260905_202054_initial.down,
    name: '20260905_202054_initial',
  },
  {
    up: migration_20260905_204707_legg_til_pleie_og_forside.up,
    down: migration_20260905_204707_legg_til_pleie_og_forside.down,
    name: '20260905_204707_legg_til_pleie_og_forside',
  },
]
