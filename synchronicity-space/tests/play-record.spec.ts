// tests/playback.spec.ts
import { test, expect } from '@playwright/test';

test('Selecting Start Listening triggers vinyl animation on Home', async ({ page }) => {
  await page.goto('/library', { waitUntil: 'networkidle' });

  const firstCard = page.locator('.album-card').first();

  await firstCard.dispatchEvent('click');

  const playBtn = page.getByRole('button', { name: /start listening/i });

  await playBtn.waitFor({ state: 'visible' });
  await playBtn.click({ force: true });

  await expect(page).toHaveURL('/home');

  const diskContainer = page.locator('.disk-container');
await diskContainer.waitFor({ state: 'attached' });

await expect(diskContainer).toHaveClass(/is-spinning/, { timeout: 7000 });
});