import * as migration_20260905_202054_initial from './20260905_202054_initial';
import * as migration_20260905_204707_legg_til_pleie_og_forside from './20260905_204707_legg_til_pleie_og_forside';
import * as migration_20260905_205224_lagrede_objekter from './20260905_205224_lagrede_objekter';
import * as migration_20260905_210411_betalingsadapter from './20260905_210411_betalingsadapter';

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
  {
    up: migration_20260905_205224_lagrede_objekter.up,
    down: migration_20260905_205224_lagrede_objekter.down,
    name: '20260905_205224_lagrede_objekter',
  },
  {
    up: migration_20260905_210411_betalingsadapter.up,
    down: migration_20260905_210411_betalingsadapter.down,
    name: '20260905_210411_betalingsadapter'
  },
];
