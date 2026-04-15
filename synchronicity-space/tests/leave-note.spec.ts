
import { test, expect } from '@playwright/test';

test('User can create and edit a note on a record', async ({ page }) => {
  await page.goto('/home', { waitUntil: 'networkidle' });

  await page.locator('.quick-pick-card').first().click();

  await page.locator('.note-image').click();

  const noteText = 'This bassline is incredible!';
  await page.locator('.note-input').fill(noteText);
  await page.locator('.add-button-retro').click();

  await page.locator('.note-entry').first().click();

  await page.locator('.action-btn.edit').click();
  await page.locator('.note-edit-textarea').fill('This bassline is legendary!');
  await page.locator('.action-btn.save').click();

  await expect(page.locator('.full-note-text')).toContainText('legendary');
});