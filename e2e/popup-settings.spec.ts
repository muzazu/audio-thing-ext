import { test, expect } from './fixtures';
import { openPopup } from './pages/popup';

test('settings tab shows injection settings form', async ({
  page,
  extensionId,
}) => {
  const popup = await openPopup(page, extensionId);
  await popup.clickSettingsTab();

  await expect(
    page.locator('h2', { hasText: 'Injection Settings' }),
  ).toBeVisible();
  await expect(popup.getRetryCountInput()).toBeVisible();
  await expect(popup.getRetryDelayInput()).toBeVisible();
});

test('can update and save settings', async ({ page, extensionId }) => {
  const popup = await openPopup(page, extensionId);
  await popup.clickSettingsTab();

  // Change retry count
  await popup.getRetryCountInput().fill('5');

  // Change retry delay
  await popup.getRetryDelayInput().fill('2000');

  // Save
  await popup.getSettingsSaveButton().click();
  await expect(popup.getSettingsSaveButton()).toHaveText('Saved!');
});

test('settings persist after reopening popup', async ({
  page,
  extensionId,
}) => {
  const popup = await openPopup(page, extensionId);
  await popup.clickSettingsTab();

  // Set custom values
  await popup.getRetryCountInput().fill('7');
  await popup.getRetryDelayInput().fill('3000');
  await popup.getSettingsSaveButton().click();
  await expect(popup.getSettingsSaveButton()).toHaveText('Saved!');

  // Reopen popup
  const popup2 = await openPopup(page, extensionId);
  await popup2.clickSettingsTab();

  // Values should be persisted
  await expect(popup2.getRetryCountInput()).toHaveValue('7');
  await expect(popup2.getRetryDelayInput()).toHaveValue('3000');
});
