import { Page, Locator } from '@playwright/test';

export class ResumesPage {
  readonly page: Page;
  readonly newResumeBtn: Locator;
  readonly resumesList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newResumeBtn = page.getByRole('button', { name: /create new|new resume/i }).first();
    this.resumesList = page.locator('.grid');
  }

  async goto() {
    await this.page.goto('/dashboard/resumes');
  }

  async createNewResume() {
    await this.newResumeBtn.click();
  }

  async getResumeCard(title: string) {
    return this.page.locator('.grid').locator('div').filter({ hasText: title }).first();
  }

  async renameResume(oldTitle: string, newTitle: string) {
    const card = await this.getResumeCard(oldTitle);
    await card.getByRole('button').first().click();
    await this.page.getByRole('menuitem', { name: /rename/i }).click();
    
    // Fill in the dialog
    const dialog = this.page.getByRole('dialog');
    await dialog.getByLabel(/resume name/i).fill(newTitle);
    await dialog.getByRole('button', { name: /save/i }).click();
  }

  async duplicateResume(title: string) {
    const card = await this.getResumeCard(title);
    await card.getByRole('button').first().click();
    await this.page.getByRole('menuitem', { name: /duplicate/i }).click();
  }

  async deleteResume(title: string) {
    const card = await this.getResumeCard(title);
    await card.getByRole('button').first().click();
    await this.page.getByRole('menuitem', { name: /delete/i }).click();
    
    // Confirm delete
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('button', { name: /delete/i }).click();
  }
}
