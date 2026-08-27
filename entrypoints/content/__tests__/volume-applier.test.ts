/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

const mocks = vi.hoisted(() => ({
  extractChannelFromDOM: vi.fn(),
  injectGainControl: vi.fn(() => ({ success: true }) as const),
}));

vi.mock('@/utils/domain', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/domain')>()),
  extractChannelFromDOM: mocks.extractChannelFromDOM,
}));

vi.mock('../gain-controller', () => ({
  injectGainControl: mocks.injectGainControl,
}));

import { appSettings, volumeEntries } from '@/utils/storage';

import { applyStoredVolume } from '../volume-applier';

const domainEntry = {
  id: 'domain',
  domain: 'www.youtube.com',
  volume: 80,
};
const channelEntry = {
  id: 'channel',
  domain: 'www.youtube.com',
  channelUrl: '/@creator',
  volume: 150,
};

describe('applyStoredVolume', () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    vi.clearAllMocks();
    mocks.injectGainControl.mockReturnValue({ success: true });
    await appSettings.setValue({ retryCount: 0, retryDelay: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses a URL channel immediately without waiting for the DOM', async () => {
    await volumeEntries.setValue([domainEntry, channelEntry]);

    await applyStoredVolume('https://www.youtube.com/@creator/videos');

    expect(mocks.extractChannelFromDOM).not.toHaveBeenCalled();
    expect(mocks.injectGainControl).toHaveBeenCalledWith(1.5);
  });

  it('applies the domain entry before upgrading to the DOM channel entry', async () => {
    let resolveChannel: (channel: string | undefined) => void;
    const channelPromise = new Promise<string | undefined>((resolve) => {
      resolveChannel = resolve;
    });
    mocks.extractChannelFromDOM.mockReturnValue(channelPromise);
    await volumeEntries.setValue([domainEntry, channelEntry]);

    const applying = applyStoredVolume('https://www.youtube.com/watch?v=123');
    await vi.waitFor(() => {
      expect(mocks.injectGainControl).toHaveBeenCalledWith(0.8);
    });

    resolveChannel!('/@creator');
    await applying;

    expect(mocks.injectGainControl).toHaveBeenLastCalledWith(1.5);
  });

  it('retries DOM channel detection before applying a channel entry', async () => {
    vi.useFakeTimers();
    mocks.extractChannelFromDOM
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce('/@creator');
    await appSettings.setValue({ retryCount: 1, retryDelay: 1000 });
    await volumeEntries.setValue([channelEntry]);

    const applying = applyStoredVolume('https://www.youtube.com/watch?v=123');
    await vi.waitFor(() => {
      expect(mocks.extractChannelFromDOM).toHaveBeenCalledTimes(1);
    });
    await vi.advanceTimersByTimeAsync(1000);
    await applying;

    expect(mocks.extractChannelFromDOM).toHaveBeenCalledTimes(2);
    expect(mocks.injectGainControl).toHaveBeenCalledWith(1.5);
  });

  it('stops DOM channel detection after the configured retry count', async () => {
    vi.useFakeTimers();
    mocks.extractChannelFromDOM.mockResolvedValue(undefined);
    await appSettings.setValue({ retryCount: 2, retryDelay: 1000 });
    await volumeEntries.setValue([channelEntry]);

    const applying = applyStoredVolume('https://www.youtube.com/watch?v=123');
    await vi.waitFor(() => {
      expect(mocks.extractChannelFromDOM).toHaveBeenCalledTimes(1);
    });
    await vi.runAllTimersAsync();
    await applying;

    expect(mocks.extractChannelFromDOM).toHaveBeenCalledTimes(3);
    expect(mocks.injectGainControl).not.toHaveBeenCalled();
  });

  it('does not inject audio processing when no saved entry matches', async () => {
    await volumeEntries.setValue([]);

    await applyStoredVolume('https://example.com/video');

    expect(mocks.injectGainControl).not.toHaveBeenCalled();
  });

  it('ignores a channel result from an older page', async () => {
    let resolveChannel: (channel: string | undefined) => void;
    mocks.extractChannelFromDOM.mockReturnValue(
      new Promise<string | undefined>((resolve) => {
        resolveChannel = resolve;
      }),
    );
    await volumeEntries.setValue([channelEntry]);

    const first = applyStoredVolume('https://www.youtube.com/watch?v=123');
    await vi.waitFor(() => {
      expect(mocks.extractChannelFromDOM).toHaveBeenCalled();
    });
    await applyStoredVolume('https://example.com/video');
    resolveChannel!('/@creator');
    await first;

    expect(mocks.injectGainControl).not.toHaveBeenCalled();
  });

  it('does not retry DOM channel detection after navigation', async () => {
    vi.useFakeTimers();
    mocks.extractChannelFromDOM.mockResolvedValue(undefined);
    await appSettings.setValue({ retryCount: 1, retryDelay: 1000 });
    await volumeEntries.setValue([channelEntry]);

    const first = applyStoredVolume('https://www.youtube.com/watch?v=123');
    await vi.waitFor(() => {
      expect(mocks.extractChannelFromDOM).toHaveBeenCalledTimes(1);
    });
    await applyStoredVolume('https://example.com/video');
    await vi.advanceTimersByTimeAsync(1000);
    await first;

    expect(mocks.extractChannelFromDOM).toHaveBeenCalledTimes(1);
  });
});
