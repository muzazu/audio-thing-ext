/**
 * Reference: https://github.com/wxt-dev/examples/blob/main/examples/playwright-e2e-testing/e2e/fixtures.ts
 */

import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

const pathToExtension = path.resolve('.output/chrome-mv3');

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // oxlint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false, // sw and some extension APIs don't work in headless mode
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let background: { url(): string };
    [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

export const expect = test.expect;
