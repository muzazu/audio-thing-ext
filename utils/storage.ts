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
