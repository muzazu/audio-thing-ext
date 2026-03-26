import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { ExtEvent } from '@/constants/actions';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CONNECTION_ERROR =
  'Could not establish connection. Receiving end does not exist.';

/**
 * Some pages are unable to inject content scripts,
 * so it is not possible to register a message listener with the page,
 * such as `chrome://newtab` and `chrome.google.com`, and this error on those sites is a noise.
 */
export const sendMessage = async (id: number, event: ExtEvent) => {
  try {
    await browser.tabs.sendMessage(id, event);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== CONNECTION_ERROR) {
      throw error;
    }
  }
};

/**
 * Sends a message to the content script of a tab and returns its response.
 * Returns undefined if the content script is not available on that tab.
 */
export const queryTab = async <T>(
  id: number,
  event: ExtEvent,
): Promise<T | undefined> => {
  try {
    return (await browser.tabs.sendMessage(id, event)) as T;
  } catch (error) {
    if (!(error instanceof Error) || error.message !== CONNECTION_ERROR) {
      throw error;
    }
    return undefined;
  }
};

/**
 * Waits for an element matching `selector` to appear in the DOM.
 * Resolves with the element when found, or null after `timeout` ms.
 */
export const waitForElement = async <T extends Element>(
  selector: string,
  timeout = 5000,
): Promise<T | null> => {
  return new Promise((resolve) => {
    const existing = document.querySelector<T>(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);

    const observer = new MutationObserver((_mutations, obs) => {
      const el = document.querySelector<T>(selector);
      if (el) {
        clearTimeout(timer);
        obs.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
};
