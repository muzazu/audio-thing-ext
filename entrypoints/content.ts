import type { ExtEvent } from '@/constants/actions';

import { waitForElement } from '@/lib/utils';
import { extractDomain } from '@/utils/domain';
import { appSettings, volumeEntries } from '@/utils/storage';

interface VideoWithGain extends HTMLVideoElement {
  _gainNode?: GainNode;
  _audioContext?: AudioContext;
  _volumeFallback?: boolean;
}

type SetVolumeResult =
  | { success: true }
  | { success: false; iframeUrl: string | null };

/**
 * Injects a GainNode into all video elements on the page to control their volume.
 */
function injectGainControl(gain: number): SetVolumeResult {
  const videos = document.querySelectorAll<VideoWithGain>('video');

  if (videos.length > 0) {
    videos.forEach((video) => {
      if (!video._gainNode) {
        // Fall back to native volume if the element is already owned by another AudioContext.
        if (video._volumeFallback) {
          video.volume = Math.min(gain, 1);
          return;
        }
        try {
          const context = new AudioContext();
          const source = context.createMediaElementSource(video);
          const gainNode = context.createGain();
          source.connect(gainNode).connect(context.destination);
          video._gainNode = gainNode;
          video._audioContext = context;
          video.addEventListener('play', () => {
            if (context.state === 'suspended') context.resume();
          });
        } catch {
          // The page already connected this element to a MediaElementSourceNode
          // in its own AudioContext (e.g. YouTube). Fall back to native volume
          // control (supports 0–100% only; gain boosting above 1x won't work).
          video._volumeFallback = true;
          video.volume = Math.min(gain, 1);
          return;
        }
      }
      video._gainNode.gain.value = gain;
    });
    return { success: true };
  }

  const iframes = Array.from(document.querySelectorAll('iframe'))
    .map((iframe) => iframe.src)
    .filter((src) => src && !src.includes('undefined'));

  return {
    success: false,
    iframeUrl: iframes.length > 0 ? iframes[0] : null,
  };
}

/**
 * Extracts the channel URL from the page DOM for special domains.
 * Uses a MutationObserver to wait for the relevant element to appear,
 * so callers do not need an external timeout.
 */
async function extractChannelFromDOM(): Promise<string | undefined> {
  const { hostname } = window.location;

  if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
    // The channel link lives inside ytd-channel-name on watch/shorts pages
    const link = await waitForElement<HTMLAnchorElement>(
      '#upload-info yt-formatted-string.ytd-channel-name a',
    );

    if (!link) return undefined;

    const href = link.getAttribute('href');
    const match = href?.match(/^\/((?:@|channel\/|c\/)[^/?#]+)/);
    return match ? `/${match[1]}` : undefined;
  }

  if (hostname === 'www.twitch.tv' || hostname === 'twitch.tv') {
    const h1 = await waitForElement<HTMLHeadingElement>('h1');

    const seg = h1?.textContent?.trim().toLowerCase();

    if (seg) return `/${seg}`;
    return undefined;
  }

  // Kick: channel is always the first path segment — already handled by extractChannelUrl
  return undefined;
}

async function applyStoredVolume(url: string) {
  const domain = extractDomain(url);
  const channelUrl = await extractChannelFromDOM();
  const entries = await volumeEntries.getValue();

  // Prefer channel-specific entry; fall back to domain-wide entry; default to 100%
  let entry = entries.find(
    (e) => e.domain === domain && (e.channelUrl ?? '') === (channelUrl ?? ''),
  );
  if (!entry && channelUrl) {
    entry = entries.find((e) => e.domain === domain && !e.channelUrl);
  }
  // Retry a few times to handle async video loads in SPAs (YouTube, Twitch, Kick)
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

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_end',
  async main(_ctx) {
    // Auto-apply stored volume on initial page load
    applyStoredVolume(window.location.href);

    // Re-apply on SPA navigation (MutationObserver inside extractChannelFromDOM
    // handles waiting for the channel element on each navigation)
    const handleNavigation = () => {
      applyStoredVolume(window.location.href);
    };
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    // YouTube fires this custom event after every client-side navigation
    window.addEventListener('yt-navigate-finish', handleNavigation);

    browser.runtime.onMessage.addListener(
      (message: ExtEvent, _sender, sendResponse) => {
        if (message?.type === 'SET_VOLUME') {
          const result = injectGainControl(message.gain);
          sendResponse(result);
        } else if (message?.type === 'GET_CHANNEL_URL') {
          extractChannelFromDOM().then((channelUrl) => {
            sendResponse({ channelUrl });
          });

          return true; // keep the response channel open for the async result
        }
      },
    );
  },
});
