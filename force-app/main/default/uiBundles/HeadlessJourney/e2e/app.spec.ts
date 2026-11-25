import { test, expect } from '@playwright/test';

test.describe('Headless Toolkit Journey', () => {
  test('opens the journey and shows setup steps for an external agent', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Explore Headless Toolkit Journey' })).toBeVisible();
    await page.getByRole('button', { name: 'Claude', exact: true }).click();
    await page.getByRole('button', { name: 'Custom Salesforce Hosted MCP Servers' }).click();
    await expect(page.getByRole('heading', { name: 'Setup Steps' })).toBeVisible();
  });

  for (const path of ['/search', '/accounts/001000000000001']) {
    test(`${path} shows 404 and links back to the journey`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await page.getByRole('link', { name: 'Go to Home' }).click();
      await expect(page.getByRole('tab', { name: 'AIforce' })).toBeVisible();
    });
  }
});
