import { describe, expect, it } from 'vitest';

import {
  createVolumeScope,
  findApplicableVolumeEntry,
  findExactVolumeEntry,
} from '../volume-scope';

const entries = [
  { id: 'domain', domain: 'youtube.com', volume: 120 },
  {
    id: 'channel',
    domain: 'youtube.com',
    channelUrl: '/@mkbhd',
    volume: 150,
  },
];

describe('createVolumeScope', () => {
  it('normalizes an empty channel URL to a domain-wide scope', () => {
    expect(createVolumeScope('youtube.com', '')).toEqual({
      domain: 'youtube.com',
      channelUrl: undefined,
    });
  });
});

describe('findExactVolumeEntry', () => {
  it('only returns the entry for the exact scope', () => {
    expect(
      findExactVolumeEntry(
        entries,
        createVolumeScope('youtube.com', '/@other'),
      ),
    ).toBeUndefined();
  });
});

describe('findApplicableVolumeEntry', () => {
  it('prefers the channel-specific entry', () => {
    expect(
      findApplicableVolumeEntry(
        entries,
        createVolumeScope('youtube.com', '/@mkbhd'),
      ),
    ).toMatchObject({ id: 'channel' });
  });

  it('falls back to the domain-wide entry when a channel has none', () => {
    expect(
      findApplicableVolumeEntry(
        entries,
        createVolumeScope('youtube.com', '/@other'),
      ),
    ).toMatchObject({ id: 'domain' });
  });
});
