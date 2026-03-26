import { storage } from '#imports';

export type VolumeEntry = {
  id: string;
  domain: string;
  volume: number; // 0–300, 100 = original
  channelUrl?: string; // e.g. "/@mkbhd", for YT/Twitch/Kick
};

export const volumeEntries = storage.defineItem<VolumeEntry[]>(
  'local:volumeEntries',
  {
    fallback: [],
    version: 1,
  },
);

export type AppSettings = {
  retryCount: number; // number of times to retry injecting gain control
  retryDelay: number; // ms between each retry attempt
};

export const appSettings = storage.defineItem<AppSettings>(
  'local:appSettings',
  {
    fallback: {
      retryCount: 5,
      retryDelay: 1000,
    },
    version: 1,
  },
);
