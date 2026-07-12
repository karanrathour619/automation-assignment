import { Page, Locator } from '@playwright/test';
import { SELECTORS, TIMEOUT } from '../utils/constants';

/**
 * Page object for the AA CE login page.
 * Provides login actions and locators for authentication.
 */

export class LoginPage {
  readonly page: Page;

  // ── Locators ──────────────────────────────────────────────────────────────
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton:  Locator;
  readonly errorMessage:  Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username', { exact: true });
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.submitButton  = page.locator(SELECTORS.LOGIN.SUBMIT_BUTTON).first();

    this.errorMessage = page.locator(
      '[class*="alert"], [class*="error"], [class*="alertbox"], [class*="message"]'
    ).filter({ hasText: /incorrect|invalid|failed|wrong|error/i }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.usernameInput.waitFor({ state: 'visible', timeout: TIMEOUT.LONG });
  }


  async enterUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async clickNext(): Promise<void> {
    const nextButton = this.page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    const isVisible = await nextButton.isVisible().catch(() => false);
    if (isVisible) {
      await nextButton.click();
      await this.passwordInput.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    }
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.clickNext();              // no-op if Next not present
    await this.enterPassword(password);
    await this.clickSubmit();

    await this.page.waitForSelector(
      'nav, [class*="sidebar"], [class*="left-nav"], [class*="navigation"], [role="navigation"]',
      { timeout: TIMEOUT.LONG }
    );
  }

  async loginWithInvalidCredentials(username: string, password: string): Promise<Locator> {
    await this.enterUsername(username);
    await this.clickNext();
    await this.enterPassword(password);
    await this.clickSubmit();
    await this.errorMessage.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    return this.errorMessage;
  }

  async isUsernameInputVisible(): Promise<boolean> {
    return this.usernameInput.isVisible();
  }

  async isPasswordInputVisible(): Promise<boolean> {
    return this.passwordInput.isVisible();
  }

  async isSubmitButtonVisible(): Promise<boolean> {
    return this.submitButton.isVisible();
  }
}
