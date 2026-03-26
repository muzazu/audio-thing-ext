import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { volumeEntries, appSettings } from '../storage';

describe('volumeEntries', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('returns empty array by default', async () => {
    expect(await volumeEntries.getValue()).toEqual([]);
  });

  it('stores and retrieves entries', async () => {
    const entries = [
      { id: '1', domain: 'youtube.com', volume: 150 },
      { id: '2', domain: 'twitch.tv', volume: 80, channelUrl: '/shroud' },
    ];
    await volumeEntries.setValue(entries);
    expect(await volumeEntries.getValue()).toEqual(entries);
  });

  it('overwrites existing entries', async () => {
    await volumeEntries.setValue([{ id: '1', domain: 'a.com', volume: 100 }]);
    await volumeEntries.setValue([{ id: '2', domain: 'b.com', volume: 200 }]);
    const result = await volumeEntries.getValue();
    expect(result).toHaveLength(1);
    expect(result[0].domain).toBe('b.com');
  });
});

describe('appSettings', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('returns fallback values by default', async () => {
    expect(await appSettings.getValue()).toEqual({
      retryCount: 1,
      retryDelay: 1000,
    });
  });

  it('stores and retrieves custom settings', async () => {
    const settings = { retryCount: 5, retryDelay: 2000 };
    await appSettings.setValue(settings);
    expect(await appSettings.getValue()).toEqual(settings);
  });
});
