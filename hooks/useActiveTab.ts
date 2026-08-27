import * as React from 'react';

import type { GetChannelUrlResponse } from '@/constants/actions';

import { queryTab } from '@/lib/utils';
import {
  extractChannelUrl,
  extractDomain,
  isSpecialDomain,
} from '@/utils/domain';
import { volumeEntries, type VolumeEntry } from '@/utils/storage';
import {
  createVolumeScope,
  findApplicableVolumeEntry,
  type VolumeScope,
} from '@/utils/volume-scope';

export interface ActiveTabInfo {
  tabId: number | undefined;
  scope: VolumeScope;
  applicableEntry: VolumeEntry | undefined;
}

/**
 * Detects the active browser tab and resolves its domain, channel URL,
 * and any matching saved volume entry.
 */
export function useActiveTab() {
  const [info, setInfo] = React.useState<ActiveTabInfo>({
    tabId: undefined,
    scope: createVolumeScope(''),
    applicableEntry: undefined,
  });

  React.useEffect(() => {
    let cancelled = false;

    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(async ([tab]) => {
        if (cancelled || !tab?.url) return;

        const tabId = tab.id;
        const domain = extractDomain(tab.url);
        let channelUrl = extractChannelUrl(tab.url);

        // Fall back to DOM extraction when the URL doesn't carry the channel
        if (!channelUrl && tabId !== undefined && isSpecialDomain(domain)) {
          const res = await queryTab<GetChannelUrlResponse>(tabId, {
            type: 'GET_CHANNEL_URL',
          });
          channelUrl = res?.channelUrl;
        }

        if (cancelled) return;

        const scope = createVolumeScope(domain, channelUrl);
        const entries = await volumeEntries.getValue();
        const applicableEntry = findApplicableVolumeEntry(entries, scope);

        if (!cancelled) {
          setInfo({ tabId, scope, applicableEntry });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
