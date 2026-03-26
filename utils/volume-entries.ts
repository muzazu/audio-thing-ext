import { volumeEntries, type VolumeEntry } from '@/utils/storage';

/**
 * Creates or updates a volume entry for the given domain/channel combination.
 * Returns the final entry (with a stable `id` for updates).
 */
export async function upsertVolumeEntry(
  domain: string,
  volume: number,
  channelUrl?: string,
): Promise<VolumeEntry> {
  const entries = await volumeEntries.getValue();
  const idx = entries.findIndex(
    (e) => e.domain === domain && (e.channelUrl ?? '') === (channelUrl ?? ''),
  );

  if (idx >= 0) {
    const updated = { ...entries[idx], volume, channelUrl };
    await volumeEntries.setValue(
      entries.map((e, i) => (i === idx ? updated : e)),
    );
    return updated;
  }

  const newEntry: VolumeEntry = {
    id: crypto.randomUUID(),
    domain,
    volume,
    channelUrl,
  };
  await volumeEntries.setValue([...entries, newEntry]);
  return newEntry;
}

/**
 * Deletes a volume entry by id.
 */
export async function deleteVolumeEntry(id: string): Promise<void> {
  const entries = await volumeEntries.getValue();
  await volumeEntries.setValue(entries.filter((e) => e.id !== id));
}
