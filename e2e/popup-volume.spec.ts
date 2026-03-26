import { test, expect } from './fixtures';
import { openPopup } from './pages/popup';

test('popup opens with Volume tab active and shows default state', async ({
  page,
  extensionId,
}) => {
  const popup = await openPopup(page, extensionId);

  // Header visible
  await expect(page.locator('h1', { hasText: 'Audio Thing' })).toBeVisible();

  // Volume form heading visible
  await expect(
    page.locator('h2', { hasText: 'Volume Settings' }),
  ).toBeVisible();

  // Domain input exists
  await expect(popup.getDomainInput()).toBeVisible();

  // Save button exists
  await expect(popup.getSaveButton()).toBeVisible();
});

test('can fill domain and save a volume entry', async ({
  page,
  extensionId,
}) => {
  const popup = await openPopup(page, extensionId);

  // Fill domain
  await popup.getDomainInput().fill('example.com');

  // Click save
  await popup.getSaveButton().click();

  // Save button should show "Saved!" indicator
  await expect(popup.getSaveButton()).toHaveText('Saved!');

  // After delay, should revert back
  await expect(popup.getSaveButton()).toHaveText('Save', { timeout: 3000 });
});

test('saved entry appears in the Saved tab', async ({ page, extensionId }) => {
  const popup = await openPopup(page, extensionId);

  // Save an entry first
  await popup.getDomainInput().fill('test-domain.com');
  await popup.getSaveButton().click();
  await expect(popup.getSaveButton()).toHaveText('Saved!');

  // Switch to Saved tab
  await popup.clickSavedTab();

  // The saved entry should appear
  await expect(page.locator('text=test-domain.com')).toBeVisible();
});
