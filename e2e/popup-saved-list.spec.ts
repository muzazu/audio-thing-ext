import { test, expect } from './fixtures';
import { openPopup } from './pages/popup';

test('shows empty state when no entries are saved', async ({
  page,
  extensionId,
}) => {
  const popup = await openPopup(page, extensionId);
  await popup.clickSavedTab();

  await expect(popup.getEmptyMessage()).toBeVisible();
});

test('can delete a saved entry', async ({ page, extensionId }) => {
  const popup = await openPopup(page, extensionId);

  // Save an entry
  await popup.getDomainInput().fill('delete-me.com');
  await popup.getSaveButton().click();
  await expect(popup.getSaveButton()).toHaveText('Saved!');

  // Switch to Saved tab
  await popup.clickSavedTab();
  await expect(popup.getEntryRows()).toHaveCount(1);

  // Delete it
  await popup.getDeleteButtons().first().click();

  // Should show empty state
  await expect(popup.getEmptyMessage()).toBeVisible();
});

test('can filter saved entries', async ({ page, extensionId }) => {
  const popup = await openPopup(page, extensionId);

  // Save two entries
  await popup.getDomainInput().fill('alpha.com');
  await popup.getSaveButton().click();
  await expect(popup.getSaveButton()).toHaveText('Saved!');
  await expect(popup.getSaveButton()).toHaveText('Save', { timeout: 3000 });

  await popup.getDomainInput().fill('beta.org');
  await popup.getSaveButton().click();
  await expect(popup.getSaveButton()).toHaveText('Saved!');

  // Switch to Saved tab
  await popup.clickSavedTab();
  await expect(popup.getEntryRows()).toHaveCount(2);

  // Filter
  await popup.getFilterInput().fill('alpha');

  // Only alpha should be visible
  await expect(popup.getEntryRows()).toHaveCount(1);
  await expect(popup.getNoMatchesMessage()).not.toBeVisible();
});
