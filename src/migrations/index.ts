import * as migration_20260905_195133_initial from './20260905_195133_initial';

export const migrations = [
  {
    up: migration_20260905_195133_initial.up,
    down: migration_20260905_195133_initial.down,
    name: '20260905_195133_initial'
  },
];
