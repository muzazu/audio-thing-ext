import type { ExtEvent } from '@/constants/actions';

import { extractChannelFromDOM } from '@/utils/domain';

import { injectGainControl, cleanupGainNodes } from './content/gain-controller';
import { setupNavigationListeners } from './content/navigation';
import { applyStoredVolume } from './content/volume-applier';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_end',
  async main(_ctx) {
    // Auto-apply stored volume on initial page load
    applyStoredVolume(window.location.href);

    // Re-apply on SPA navigation
    const removeNavigationListeners = setupNavigationListeners();

    // Handle messages from the popup
    const messageListener = (
      message: ExtEvent,
      _sender: Browser.runtime.MessageSender,
      sendResponse: (response?: any) => void,
    ) => {
      if (message?.type === 'SET_VOLUME') {
        const result = injectGainControl(message.gain);
        sendResponse(result);
      } else if (message?.type === 'GET_CHANNEL_URL') {
        extractChannelFromDOM().then((channelUrl) => {
          sendResponse({ channelUrl });
        });
        return true; // keep the response channel open for the async result
      }
    };
    browser.runtime.onMessage.addListener(messageListener);

    // Clean up everything when the content script is invalidated
    _ctx.onInvalidated(() => {
      removeNavigationListeners();
      browser.runtime.onMessage.removeListener(messageListener);
      cleanupGainNodes();
    });
  },
});
