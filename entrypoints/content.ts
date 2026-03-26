import type { ExtEvent } from '@/constants/actions';

import { extractChannelUrl, extractDomain } from '@/utils/domain';
import { volumeEntries } from '@/utils/storage';

interface VideoWithGain extends HTMLVideoElement {
  _gainNode?: GainNode;
  _audioContext?: AudioContext;
}

type SetVolumeResult =
  | { success: true }
  | { success: false; iframeUrl: string | null };

/**
 * Injects a GainNode into all video elements on the page to control their volume.
 */
function injectGainControl(gain: number): SetVolumeResult {
  const videos = document.querySelectorAll<VideoWithGain>('video');
  console.log(
    `Injecting gain control with gain=${gain} to ${videos.length} videos`,
  );
  if (videos.length > 0) {
    videos.forEach((video) => {
      if (!video._gainNode) {
        const context = new AudioContext();
        const source = context.createMediaElementSource(video);
        const gainNode = context.createGain();
        source.connect(gainNode).connect(context.destination);
        video._gainNode = gainNode;
        video._audioContext = context;
        video.addEventListener('play', () => {
          if (context.state === 'suspended') context.resume();
        });
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
 * Try to apply the stored volume for the current URL, retrying a few times
 * to handle async video loads in SPAs (YouTube, Twitch, Kick).
 */
function applyStoredVolumeAt(gain: number, retries = 5, delay = 1000) {
  const result = injectGainControl(gain);
  if (!result.success && retries > 0) {
    setTimeout(() => applyStoredVolumeAt(gain, retries - 1, delay), delay);
  }
}

async function applyStoredVolume(url: string) {
  const domain = extractDomain(url);
  const channelUrl = extractChannelUrl(url);
  const entries = await volumeEntries.getValue();
  const entry = entries.find(
    (e) => e.domain === domain && (e.channelUrl ?? '') === (channelUrl ?? ''),
  );
  if (!entry) return;
  applyStoredVolumeAt(entry.volume / 100);
}

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    // Auto-apply stored volume on initial page load
    applyStoredVolume(window.location.href);

    // Re-apply on SPA navigation
    const handleNavigation = () => applyStoredVolume(window.location.href);
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    // YouTube fires this custom event after every client-side navigation
    window.addEventListener('yt-navigate-finish', handleNavigation);

    browser.runtime.onMessage.addListener(
      (message: ExtEvent, _sender, sendResponse) => {
        console.log('Received message in content script:', message);
        if (message?.type !== 'SET_VOLUME') return;
        const result = injectGainControl(message.gain);
        sendResponse(result);
      },
    );
  },
});
