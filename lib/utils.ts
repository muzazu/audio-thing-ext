import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { ExtEvent } from '@/constants/actions';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Some pages are unable to inject content scripts,
 * so it is not possible to register a message listener with the page,
 * such as `chrome://newtab` and `chrome.google.com`, and this error on those sites is a noise.
 */
export const sendMessage = async (id: number, event: ExtEvent) => {
  try {
    await browser.tabs.sendMessage(id, event);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !==
        'Could not establish connection. Receiving end does not exist.'
    ) {
      throw error;
    }
    console.error(`Failed to send message to tab ${id}:`, error);
  }
};
