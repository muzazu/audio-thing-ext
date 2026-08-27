import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { volumeEntries } from '../storage';
import { upsertVolumeEntry, deleteVolumeEntry } from '../volume-entries';
import { createVolumeScope } from '../volume-scope';

describe('upsertVolumeEntry', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('creates a new entry when none exists', async () => {
    const entry = await upsertVolumeEntry(
      createVolumeScope('youtube.com', '/@mkbhd'),
      150,
    );
    expect(entry.domain).toBe('youtube.com');
    expect(entry.volume).toBe(150);
    expect(entry.channelUrl).toBe('/@mkbhd');
    expect(entry.id).toBeTruthy();

    const stored = await volumeEntries.getValue();
    expect(stored).toHaveLength(1);
  });

  it('updates an existing entry matching domain + channelUrl', async () => {
    await volumeEntries.setValue([
      {
        id: 'existing-1',
        domain: 'youtube.com',
        volume: 100,
        channelUrl: '/@mkbhd',
      },
    ]);

    const updated = await upsertVolumeEntry(
      createVolumeScope('youtube.com', '/@mkbhd'),
      200,
    );
    expect(updated.volume).toBe(200);

    const stored = await volumeEntries.getValue();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('existing-1');
    expect(stored[0].volume).toBe(200);
  });

  it('creates a separate entry for a different channel on the same domain', async () => {
    await volumeEntries.setValue([
      {
        id: 'existing-1',
        domain: 'youtube.com',
        volume: 100,
        channelUrl: '/@mkbhd',
      },
    ]);

    await upsertVolumeEntry(createVolumeScope('youtube.com', '/@linus'), 80);

    const stored = await volumeEntries.getValue();
    expect(stored).toHaveLength(2);
  });

  it('handles domain-wide entries (no channelUrl)', async () => {
    await upsertVolumeEntry(createVolumeScope('example.com'), 120);

    const stored = await volumeEntries.getValue();
    expect(stored).toHaveLength(1);
    expect(stored[0].channelUrl).toBeUndefined();
  });
});

describe('deleteVolumeEntry', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('deletes an entry by id', async () => {
    await volumeEntries.setValue([
      { id: 'a', domain: 'a.com', volume: 100 },
      { id: 'b', domain: 'b.com', volume: 200 },
    ]);

    await deleteVolumeEntry('a');

    const stored = await volumeEntries.getValue();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('b');
  });

  it('does nothing when id does not exist', async () => {
    await volumeEntries.setValue([{ id: 'a', domain: 'a.com', volume: 100 }]);

    await deleteVolumeEntry('nonexistent');

    const stored = await volumeEntries.getValue();
    expect(stored).toHaveLength(1);
  });
});
