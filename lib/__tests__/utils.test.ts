import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { sendMessage, queryTab } from '../utils';

describe('sendMessage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('sends a message to a tab', async () => {
    const spy = vi
      .spyOn(fakeBrowser.tabs, 'sendMessage')
      .mockResolvedValue(undefined);
    await expect(
      sendMessage(1, { type: 'SET_VOLUME', gain: 1.5 }),
    ).resolves.toBeUndefined();
    spy.mockRestore();
  });

  it('swallows "could not establish connection" errors', async () => {
    const spy = vi
      .spyOn(fakeBrowser.tabs, 'sendMessage')
      .mockRejectedValue(
        new Error(
          'Could not establish connection. Receiving end does not exist.',
        ),
      );

    await expect(
      sendMessage(1, { type: 'SET_VOLUME', gain: 1 }),
    ).resolves.toBeUndefined();
    spy.mockRestore();
  });

  it('re-throws other errors', async () => {
    const spy = vi
      .spyOn(fakeBrowser.tabs, 'sendMessage')
      .mockRejectedValue(new Error('Something else went wrong'));

    await expect(
      sendMessage(1, { type: 'SET_VOLUME', gain: 1 }),
    ).rejects.toThrow('Something else went wrong');
    spy.mockRestore();
  });
});

describe('queryTab', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('returns the response from the tab', async () => {
    const spy = vi
      .spyOn(fakeBrowser.tabs, 'sendMessage')
      .mockResolvedValue({ channelUrl: '/@mkbhd' });

    const result = await queryTab<{ channelUrl: string }>(1, {
      type: 'GET_CHANNEL_URL',
    });
    expect(result).toEqual({ channelUrl: '/@mkbhd' });
    spy.mockRestore();
  });

  it('returns undefined when connection cannot be established', async () => {
    const spy = vi
      .spyOn(fakeBrowser.tabs, 'sendMessage')
      .mockRejectedValue(
        new Error(
          'Could not establish connection. Receiving end does not exist.',
        ),
      );

    const result = await queryTab(1, { type: 'GET_CHANNEL_URL' });
    expect(result).toBeUndefined();
    spy.mockRestore();
  });
});
