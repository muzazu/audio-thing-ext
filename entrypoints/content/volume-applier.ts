import {
  extractChannelFromDOM,
  extractChannelUrl,
  extractDomain,
} from '@/utils/domain';
import { appSettings, volumeEntries } from '@/utils/storage';
import {
  createVolumeScope,
  findExactVolumeEntry,
  findApplicableVolumeEntry,
} from '@/utils/volume-scope';

import { injectGainControl } from './gain-controller';

/**
 * Identifies the most recently started lookup. Async channel detection from an
 * old page must not alter audio on the page the user has already navigated to.
 */
let latestApplicationId = 0;

/** Identifies the gain value currently allowed to retry injection. */
let latestInjectionId = 0;

function applyGain(
  gain: number,
  applicationId: number,
  retryCount: number,
  retryDelay: number,
): void {
  const injectionId = ++latestInjectionId;

  function tryInject(retries = retryCount): void {
    if (
      applicationId !== latestApplicationId ||
      injectionId !== latestInjectionId
    ) {
      return;
    }

    const result = injectGainControl(gain);
    if (!result.success && retries > 0) {
      setTimeout(() => tryInject(retries - 1), retryDelay);
    }
  }

  tryInject();
}

async function extractChannelWithRetry(
  domain: string,
  applicationId: number,
  retryCount: number,
  retryDelay: number,
): Promise<string | undefined> {
  const timeout = domain.includes('twitch.tv') ? 5000 : 100;
  let retries = retryCount;

  while (applicationId === latestApplicationId) {
    const channel = await extractChannelFromDOM(timeout);
    if (channel || applicationId !== latestApplicationId) {
      return channel;
    }

    if (retries === 0) {
      return undefined;
    }

    retries -= 1;
    await new Promise<void>((resolve) => setTimeout(resolve, retryDelay));
  }

  return undefined;
}

/**
 * Applies a saved volume preference, first using the URL and then—only when
 * necessary—waiting briefly for a channel revealed by the page DOM.
 */
export async function applyStoredVolume(url: string): Promise<void> {
  const applicationId = ++latestApplicationId;
  // Cancel retries left behind by a prior page, even when this page has no entry.
  ++latestInjectionId;
  const domain = extractDomain(url);
  const [entries, { retryCount, retryDelay }] = await Promise.all([
    volumeEntries.getValue(),
    appSettings.getValue(),
  ]);

  if (applicationId !== latestApplicationId) {
    return;
  }

  const channelFromUrl = extractChannelUrl(url);
  if (channelFromUrl) {
    const entry = findApplicableVolumeEntry(
      entries,
      createVolumeScope(domain, channelFromUrl),
    );
    if (entry) {
      applyGain(entry.volume / 100, applicationId, retryCount, retryDelay);
    }
    return;
  }

  const domainEntry = findExactVolumeEntry(entries, createVolumeScope(domain));
  if (domainEntry) {
    applyGain(domainEntry.volume / 100, applicationId, retryCount, retryDelay);
  }

  const hasChannelEntry = entries.some(
    (entry) => entry.domain === domain && entry.channelUrl,
  );
  if (!hasChannelEntry) {
    return;
  }

  // Twitch renders a bit slower, so each lookup gets a longer timeout.
  const channelFromDOM = await extractChannelWithRetry(
    domain,
    applicationId,
    retryCount,
    retryDelay,
  );

  if (!channelFromDOM || applicationId !== latestApplicationId) {
    return;
  }

  const channelEntry = findExactVolumeEntry(
    entries,
    createVolumeScope(domain, channelFromDOM),
  );
  if (channelEntry) {
    applyGain(channelEntry.volume / 100, applicationId, retryCount, retryDelay);
  } else if (domainEntry) {
    applyGain(domainEntry.volume / 100, applicationId, retryCount, retryDelay);
  } else {
    applyGain(1, applicationId, retryCount, retryDelay);
  }
}
