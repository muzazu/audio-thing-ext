export interface VideoWithGain extends HTMLVideoElement {
  _gainNode?: GainNode;
  _audioContext?: AudioContext;
  _volumeFallback?: boolean;
}

export type SetVolumeResult =
  | { success: true }
  | { success: false; iframeUrl: string | null };

/** Tracks all videos we've attached a GainNode or fallback to. */
const managedVideos = new Set<VideoWithGain>();

/**
 * Injects a GainNode into all video elements on the page to control their volume.
 */
export function injectGainControl(gain: number): SetVolumeResult {
  const videos = document.querySelectorAll<VideoWithGain>('video');

  if (videos.length > 0) {
    videos.forEach((video) => {
      managedVideos.add(video);

      if (!video._gainNode) {
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
 * Disconnects all managed AudioContexts and clears tracked state.
 * Should be called when the content script is invalidated.
 */
export function cleanupGainNodes(): void {
  for (const video of managedVideos) {
    if (video._audioContext) {
      video._audioContext.close().catch(() => {});
    }
    video._gainNode = undefined;
    video._audioContext = undefined;
    video._volumeFallback = undefined;
  }
  managedVideos.clear();
}
