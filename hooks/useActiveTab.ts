import * as React from 'react';

import type { GetChannelUrlResponse } from '@/constants/actions';

import { queryTab } from '@/lib/utils';
import {
  extractChannelUrl,
  extractDomain,
  isSpecialDomain,
} from '@/utils/domain';
import { volumeEntries, type VolumeEntry } from '@/utils/storage';

export interface ActiveTabInfo {
  tabId: number | undefined;
  domain: string;
  channelUrl: string | undefined;
  existingEntry: VolumeEntry | undefined;
}

/**
 * Detects the active browser tab and resolves its domain, channel URL,
 * and any matching saved volume entry.
 */
export function useActiveTab() {
  const [info, setInfo] = React.useState<ActiveTabInfo>({
    tabId: undefined,
    domain: '',
    channelUrl: undefined,
    existingEntry: undefined,
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
          console.log('Extracted channel URL from tab:', res?.channelUrl);
          channelUrl = res?.channelUrl;
        }

        if (cancelled) return;

        const entries = await volumeEntries.getValue();
        const existingEntry = entries.find(
          (e) =>
            e.domain === domain && (e.channelUrl ?? '') === (channelUrl ?? ''),
        );

        if (!cancelled) {
          setInfo({ tabId, domain, channelUrl, existingEntry });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
