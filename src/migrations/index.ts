import * as migration_20260905_202054_initial from './20260905_202054_initial';

export const migrations = [
  {
    up: migration_20260905_202054_initial.up,
    down: migration_20260905_202054_initial.down,
    name: '20260905_202054_initial'
  },
];
