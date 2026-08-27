import { storage } from '#imports';

import type { VolumeScope } from './volume-scope';

export type VolumeEntry = VolumeScope & {
  id: string;
  volume: number; // 0–900, 100 = original
};

export const volumeEntries = storage.defineItem<VolumeEntry[]>(
  'local:volumeEntries',
  {
    fallback: [],
    version: 1,
  },
);

export type AppSettings = {
  retryCount: number; // number of times to retry detection and gain-control injection
  retryDelay: number; // ms between each retry attempt
};

export const appSettings = storage.defineItem<AppSettings>(
  'local:appSettings',
  {
    fallback: {
      retryCount: 1,
      retryDelay: 1000,
    },
    version: 1,
  },
);
