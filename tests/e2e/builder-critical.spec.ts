import { test, expect } from './fixtures/builder-fixture';
import { ResumesPage } from './pages/ResumesPage';
import { BuilderPage } from './pages/BuilderPage';

test.describe('Builder Critical Flows', () => {
  test.beforeEach(async ({ clearLocalStorage }) => {
    await clearLocalStorage();
  });

  test('App loads successfully and creates a new resume', async ({ page }) => {
    const resumesPage = new ResumesPage(page);
    await resumesPage.goto();
    
    // Ensure we are on the dashboard
    await expect(page.locator('h1', { hasText: 'Resumes' })).toBeVisible();

    await resumesPage.createNewResume();

    // Ensure we are navigated to the builder
    const builderPage = new BuilderPage(page);
    await expect(page).toHaveURL(/.*\/dashboard\/builder/);

    // Verify default title is loaded
    await expect(builderPage.resumeTitleInput).toHaveValue('Untitled Resume');
  });

  test('Auto-save while typing', async ({ page, waitForAutoSave }) => {
    const builderPage = new BuilderPage(page);
    await builderPage.goto();

    await builderPage.updateResumeTitle('My Awesome Resume');
    await builderPage.updateFirstName('John');

    // Wait for the "Saved" indicator to appear
    await waitForAutoSave();

    // Verify local storage directly
    const savedDraft = await page.evaluate(() => localStorage.getItem('hirecraft_draft_new'));
    expect(savedDraft).toContain('My Awesome Resume');
    expect(savedDraft).toContain('John');
  });

  test('Refresh page and verify persistence', async ({ page, waitForAutoSave }) => {
    const builderPage = new BuilderPage(page);
    await builderPage.goto();

    await builderPage.updateResumeTitle('To Be Refreshed');
    await waitForAutoSave();

    // Reload the page
    await page.reload();

    // Verify data persisted across reload
    await expect(builderPage.resumeTitleInput).toHaveValue('To Be Refreshed');
  });

  test('Rename, duplicate, and delete resume', async ({ page, waitForAutoSave }) => {
    // 1. Create a resume
    const resumesPage = new ResumesPage(page);
    await resumesPage.goto();
    await resumesPage.createNewResume();
    const builderPage = new BuilderPage(page);
    await builderPage.updateResumeTitle('Original Resume');
    await waitForAutoSave();

    // 2. Go back to resumes list
    const resumesPage = new ResumesPage(page);
    await resumesPage.goto();
    
    // Wait for hydration
    await expect(page.locator('text=Original Resume')).toBeVisible();

    // 3. Rename
    await resumesPage.renameResume('Original Resume', 'Renamed Resume');
    await expect(page.locator('text=Renamed Resume')).toBeVisible();
    await expect(page.locator('text=Original Resume')).not.toBeVisible();

    // 4. Duplicate
    await resumesPage.duplicateResume('Renamed Resume');
    await expect(page.locator('text=Renamed Resume (Copy)')).toBeVisible();

    // 5. Delete
    await resumesPage.deleteResume('Renamed Resume (Copy)');
    await expect(page.locator('text=Renamed Resume (Copy)')).not.toBeVisible();
  });

  test('Invalid resume ID redirects to resumes list', async ({ page }) => {
    // Navigate with a random ID
    await page.goto('/dashboard/builder?id=uuid-not-found');

    // Should redirect to resumes
    await expect(page).toHaveURL(/.*\/dashboard\/resumes/);
  });
});
