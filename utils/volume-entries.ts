import { volumeEntries, type VolumeEntry } from '@/utils/storage';
import { findExactVolumeEntry, type VolumeScope } from '@/utils/volume-scope';

/**
 * Creates or updates a volume entry for the given domain/channel combination.
 * Returns the final entry (with a stable `id` for updates).
 */
export async function upsertVolumeEntry(
  scope: VolumeScope,
  volume: number,
): Promise<VolumeEntry> {
  const entries = await volumeEntries.getValue();
  const existing = findExactVolumeEntry(entries, scope);

  if (existing) {
    const updated = { ...existing, ...scope, volume };
    await volumeEntries.setValue(
      entries.map((entry) => (entry.id === existing.id ? updated : entry)),
    );
    return updated;
  }

  const newEntry: VolumeEntry = {
    id: crypto.randomUUID(),
    ...scope,
    volume,
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
