# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: builder-critical.spec.ts >> Builder Critical Flows >> Rename, duplicate, and delete resume
- Location: tests\e2e\builder-critical.spec.ts:57:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Original Resume')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Original Resume')

```

```yaml
- link "HireCraft AI":
  - /url: /dashboard
- button "Collapse sidebar"
- navigation:
  - link "Overview":
    - /url: /dashboard
  - link "My Resumes":
    - /url: /dashboard/resumes
  - link "Resume Builder":
    - /url: /dashboard/builder
  - link "Upload Resume":
    - /url: /dashboard/upload
  - link "Job Matcher":
    - /url: /dashboard/matcher
  - link "ATS Report":
    - /url: /dashboard/ats-report
  - link "AI Suggestions":
    - /url: /dashboard/ai-suggestions
  - link "Cover Letters":
    - /url: /dashboard/cover-letter
  - link "LinkedIn Optimizer":
    - /url: /dashboard/linkedin
  - link "Templates":
    - /url: /dashboard/templates
  - link "Exports":
    - /url: /dashboard/export
  - link "Settings":
    - /url: /dashboard/settings
- text: US User demo@example.com
- button "Sign out"
- main:
  - heading "My Resumes" [level=1]
  - paragraph: Manage and organize your saved resumes.
  - heading "No resumes yet" [level=3]
  - paragraph: Create your first resume to start matching with jobs and generating cover letters.
  - button "Create New"
  - button "Upload Existing"
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { test, expect } from './fixtures/builder-fixture';
  2  | import { ResumesPage } from './pages/ResumesPage';
  3  | import { BuilderPage } from './pages/BuilderPage';
  4  | 
  5  | test.describe('Builder Critical Flows', () => {
  6  |   test.beforeEach(async ({ clearLocalStorage }) => {
  7  |     await clearLocalStorage();
  8  |   });
  9  | 
  10 |   test('App loads successfully and creates a new resume', async ({ page }) => {
  11 |     const resumesPage = new ResumesPage(page);
  12 |     await resumesPage.goto();
  13 |     
  14 |     // Ensure we are on the dashboard
  15 |     await expect(page.locator('h1', { hasText: 'Resumes' })).toBeVisible();
  16 | 
  17 |     await resumesPage.createNewResume();
  18 | 
  19 |     // Ensure we are navigated to the builder
  20 |     const builderPage = new BuilderPage(page);
  21 |     await expect(page).toHaveURL(/.*\/dashboard\/builder/);
  22 | 
  23 |     // Verify default title is loaded
  24 |     await expect(builderPage.resumeTitleInput).toHaveValue('Untitled Resume');
  25 |   });
  26 | 
  27 |   test('Auto-save while typing', async ({ page, waitForAutoSave }) => {
  28 |     const builderPage = new BuilderPage(page);
  29 |     await builderPage.goto();
  30 | 
  31 |     await builderPage.updateResumeTitle('My Awesome Resume');
  32 |     await builderPage.updateFirstName('John');
  33 | 
  34 |     // Wait for the "Saved" indicator to appear
  35 |     await waitForAutoSave();
  36 | 
  37 |     // Verify local storage directly
  38 |     const savedDraft = await page.evaluate(() => localStorage.getItem('hirecraft_draft_new'));
  39 |     expect(savedDraft).toContain('My Awesome Resume');
  40 |     expect(savedDraft).toContain('John');
  41 |   });
  42 | 
  43 |   test('Refresh page and verify persistence', async ({ page, waitForAutoSave }) => {
  44 |     const builderPage = new BuilderPage(page);
  45 |     await builderPage.goto();
  46 | 
  47 |     await builderPage.updateResumeTitle('To Be Refreshed');
  48 |     await waitForAutoSave();
  49 | 
  50 |     // Reload the page
  51 |     await page.reload();
  52 | 
  53 |     // Verify data persisted across reload
  54 |     await expect(builderPage.resumeTitleInput).toHaveValue('To Be Refreshed');
  55 |   });
  56 | 
  57 |   test('Rename, duplicate, and delete resume', async ({ page, waitForAutoSave }) => {
  58 |     // 1. Create a resume
  59 |     const builderPage = new BuilderPage(page);
  60 |     await builderPage.goto();
  61 |     await builderPage.updateResumeTitle('Original Resume');
  62 |     await waitForAutoSave();
  63 | 
  64 |     // 2. Go back to resumes list
  65 |     const resumesPage = new ResumesPage(page);
  66 |     await resumesPage.goto();
  67 |     
  68 |     // Wait for hydration
> 69 |     await expect(page.locator('text=Original Resume')).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  70 | 
  71 |     // 3. Rename
  72 |     await resumesPage.renameResume('Original Resume', 'Renamed Resume');
  73 |     await expect(page.locator('text=Renamed Resume')).toBeVisible();
  74 |     await expect(page.locator('text=Original Resume')).not.toBeVisible();
  75 | 
  76 |     // 4. Duplicate
  77 |     await resumesPage.duplicateResume('Renamed Resume');
  78 |     await expect(page.locator('text=Renamed Resume (Copy)')).toBeVisible();
  79 | 
  80 |     // 5. Delete
  81 |     await resumesPage.deleteResume('Renamed Resume (Copy)');
  82 |     await expect(page.locator('text=Renamed Resume (Copy)')).not.toBeVisible();
  83 |   });
  84 | 
  85 |   test('Invalid resume ID redirects to resumes list', async ({ page }) => {
  86 |     // Navigate with a random ID
  87 |     await page.goto('/dashboard/builder?id=uuid-not-found');
  88 | 
  89 |     // Should redirect to resumes
  90 |     await expect(page).toHaveURL(/.*\/dashboard\/resumes/);
  91 |   });
  92 | });
  93 | 
```