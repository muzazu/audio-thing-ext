/** Identifies the domain-wide or channel-specific volume preference for a page. */
export type VolumeScope = {
  domain: string;
  channelUrl?: string;
};

/** Creates the canonical form used when comparing and persisting a volume scope. */
export function createVolumeScope(
  domain: string,
  channelUrl?: string,
): VolumeScope {
  return { domain, channelUrl: channelUrl || undefined };
}

/** Returns whether a saved value belongs to the supplied scope. */
export function hasVolumeScope(
  value: VolumeScope,
  scope: VolumeScope,
): boolean {
  return (
    value.domain === scope.domain &&
    (value.channelUrl ?? '') === (scope.channelUrl ?? '')
  );
}

/** Finds the entry saved for exactly this domain and channel combination. */
export function findExactVolumeEntry<T extends VolumeScope>(
  entries: readonly T[],
  scope: VolumeScope,
): T | undefined {
  return entries.find((entry) => hasVolumeScope(entry, scope));
}

/**
 * Finds the preference that applies to a page: a channel entry wins over the
 * domain-wide fallback.
 */
export function findApplicableVolumeEntry<T extends VolumeScope>(
  entries: readonly T[],
  scope: VolumeScope,
): T | undefined {
  return (
    findExactVolumeEntry(entries, scope) ??
    (scope.channelUrl
      ? findExactVolumeEntry(entries, createVolumeScope(scope.domain))
      : undefined)
  );
}
