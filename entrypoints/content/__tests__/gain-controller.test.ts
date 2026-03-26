/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { injectGainControl, cleanupGainNodes } from '../gain-controller';

// Mock the Web Audio API
function createMockVideo(overrides: Partial<HTMLVideoElement> = {}) {
  const video = document.createElement('video') as any;
  Object.assign(video, overrides);
  return video;
}

describe('injectGainControl', () => {
  beforeEach(() => {
    cleanupGainNodes();
    document.body.innerHTML = '';
  });

  it('returns { success: false } when no videos exist', () => {
    const result = injectGainControl(1.0);
    expect(result.success).toBe(false);
  });

  it('returns iframeUrl when iframes are present and no videos', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://example.com/embed';
    document.body.appendChild(iframe);

    const result = injectGainControl(1.0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.iframeUrl).toBe('https://example.com/embed');
    }
  });

  it('returns iframeUrl as null when no iframes and no videos', () => {
    const result = injectGainControl(1.0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.iframeUrl).toBeNull();
    }
  });

  it('sets fallback volume on videos that have _volumeFallback set', () => {
    const video = createMockVideo();
    video._volumeFallback = true;
    video.volume = 1;
    document.body.appendChild(video);

    const result = injectGainControl(0.5);
    expect(result.success).toBe(true);
    expect(video.volume).toBe(0.5);
  });

  it('clamps fallback volume to 1.0 max', () => {
    const video = createMockVideo();
    video._volumeFallback = true;
    video.volume = 1;
    document.body.appendChild(video);

    injectGainControl(2.5);
    expect(video.volume).toBe(1);
  });
});

describe('cleanupGainNodes', () => {
  it('does not throw when called with no managed videos', () => {
    expect(() => cleanupGainNodes()).not.toThrow();
  });
});
