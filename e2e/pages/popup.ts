/**
 * Reference: https://github.com/wxt-dev/examples/blob/main/examples/playwright-e2e-testing/e2e/pages/popup.ts
 */

import type { Page } from '@playwright/test';

export async function openPopup(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForSelector('h1');

  // Test IDs are added to key elements in the popup to make them easier to select in tests.
  // Tried using `value` or `placeholder`, but they don’t work well with Playwright selectors.
  return {
    // Tabs
    clickVolumeTab: () => page.getByTestId('tab-volume').click(),
    clickSavedTab: () => page.getByTestId('tab-saved').click(),
    clickSettingsTab: () => page.getByTestId('tab-settings').click(),

    // Volume form
    getDomainInput: () => page.getByTestId('domain-input'),
    getChannelInput: () => page.getByTestId('channel-url-input'),
    getVolumeSlider: () => page.getByTestId('volume-slider'),
    getSaveButton: () => page.getByTestId('save-button'),

    // Saved list
    getEntryRows: () => page.getByTestId('entry-row'),
    getFilterInput: () => page.getByTestId('filter-input'),
    getDeleteButtons: () => page.getByTestId('delete-button'),
    getEmptyMessage: () => page.getByTestId('empty-message'),
    getNoMatchesMessage: () => page.getByTestId('no-matches-message'),

    // Settings form
    getRetryCountInput: () => page.getByTestId('retry-count-input'),
    getRetryDelayInput: () => page.getByTestId('retry-delay-input'),
    getSettingsSaveButton: () => page.getByTestId('settings-save-button'),

    // General
    page,
  };
}
