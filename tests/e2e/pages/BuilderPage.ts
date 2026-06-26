import { Page, Locator } from '@playwright/test';

export class BuilderPage {
  readonly page: Page;
  readonly resumeTitleInput: Locator;
  readonly firstNameInput: Locator;
  readonly saveIndicator: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.resumeTitleInput = page.getByLabel(/resume title/i);
    this.firstNameInput = page.getByLabel(/first name/i);
    this.saveIndicator = page.locator('text=Saved');
    this.backButton = page.getByRole('link', { name: /back/i });
  }

  async goto(id?: string) {
    if (id) {
      await this.page.goto(`/dashboard/builder?id=${id}`);
    } else {
      await this.page.goto('/dashboard/builder');
    }
  }

  async updateResumeTitle(title: string) {
    await this.resumeTitleInput.fill(title);
  }

  async updateFirstName(name: string) {
    await this.firstNameInput.fill(name);
  }

  async waitForSave() {
    await this.page.waitForSelector('text=Saved');
  }
}
