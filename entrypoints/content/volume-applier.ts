import { extractChannelFromDOM } from '@/utils/domain';
import { extractDomain } from '@/utils/domain';
import { appSettings, volumeEntries } from '@/utils/storage';

import { injectGainControl } from './gain-controller';

/**
 * Looks up the stored volume for the current page (by domain + optional channel)
 * and injects a GainNode at that level, retrying according to the user's settings.
 */
export async function applyStoredVolume(url: string): Promise<void> {
  const domain = extractDomain(url);
  const channelUrl = await extractChannelFromDOM();
  const entries = await volumeEntries.getValue();

  // Prefer channel-specific entry; fall back to domain-wide entry; default to 100 %
  let entry = entries.find(
    (e) => e.domain === domain && (e.channelUrl ?? '') === (channelUrl ?? ''),
  );
  if (!entry && channelUrl) {
    entry = entries.find((e) => e.domain === domain && !e.channelUrl);
  }

  const gain = entry ? entry.volume / 100 : 1.0;
  const { retryCount, retryDelay } = await appSettings.getValue();

  function tryInject(retries = retryCount, delay = retryDelay) {
    const result = injectGainControl(gain);
    if (!result.success && retries > 0) {
      setTimeout(() => tryInject(retries - 1, delay), delay);
    }
  }

  tryInject();
}
