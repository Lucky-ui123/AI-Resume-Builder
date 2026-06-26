import { test as base, expect, Page } from '@playwright/test';

type BuilderFixtures = {
  clearLocalStorage: () => Promise<void>;
  seedLocalStorage: (data: any) => Promise<void>;
  waitForAutoSave: () => Promise<void>;
};

export const test = base.extend<BuilderFixtures>({
  clearLocalStorage: async ({ page }, use) => {
    await use(async () => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
    });
  },
  seedLocalStorage: async ({ page }, use) => {
    await use(async (data: any) => {
      await page.goto('/');
      await page.evaluate((dataToSeed) => {
        localStorage.setItem('hirecraft_resumes', JSON.stringify(dataToSeed));
      }, data);
    });
  },
  waitForAutoSave: async ({ page }, use) => {
    await use(async () => {
      // The auto-save debounce is 1000ms. Wait for the 'Saved' indicator in the UI.
      const savedIndicator = page.locator('text=Saved');
      await expect(savedIndicator).toBeVisible({ timeout: 5000 });
    });
  }
});

export { expect };
