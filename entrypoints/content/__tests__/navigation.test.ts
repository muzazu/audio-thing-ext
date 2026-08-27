/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ applyStoredVolume: vi.fn() }));

vi.mock('../volume-applier', () => ({
  applyStoredVolume: mocks.applyStoredVolume,
}));

import { setupNavigationListeners } from '../navigation';

describe('setupNavigationListeners', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('re-applies volume after history navigation and restores history on cleanup', () => {
    const originalPushState = history.pushState;
    const removeListeners = setupNavigationListeners();

    history.pushState({}, '', '/next');

    expect(mocks.applyStoredVolume).toHaveBeenCalledWith(window.location.href);

    removeListeners();
    expect(history.pushState).toBe(originalPushState);

    history.pushState({}, '', '/after-cleanup');
    expect(mocks.applyStoredVolume).toHaveBeenCalledTimes(1);
  });
});
