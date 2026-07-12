import { Page, Locator } from '@playwright/test';
import { SELECTORS, TIMEOUT } from '../utils/constants';

/**
 * Handles navigation in the AA CE left-hand sidebar and the Create dropdown.
 */
export class AutomationListPage {
  readonly page: Page;

  readonly automationMenuItem: Locator;
  readonly createDropdown:     Locator;
  readonly createFormOption:   Locator;

  constructor(page: Page) {
    this.page = page;
    this.automationMenuItem = page.locator(SELECTORS.NAV.AUTOMATION_MENU_ITEM).first();
    this.createDropdown     = page.locator(SELECTORS.NAV.CREATE_DROPDOWN).first();
    this.createFormOption   = page.locator(SELECTORS.NAV.CREATE_FORM_OPTION).first();
  }

  async navigateToAutomation(): Promise<void> {
    await this.automationMenuItem.waitFor({ state: 'visible', timeout: TIMEOUT.LONG });
    await this.automationMenuItem.click();
    await this.createDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.LONG });
  }

  async openCreateDropdown(): Promise<void> {
    await this.createDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await this.createDropdown.click();
    await this.createFormOption.waitFor({ state: 'visible', timeout: TIMEOUT.SHORT });
  }

  async selectFormFromDropdown(): Promise<void> {
    await this.createFormOption.click();
  }

  /**
   * Full flow: navigate to Automation → open Create dropdown → select Form.
   */
  async navigateAndCreateForm(): Promise<void> {
    await this.navigateToAutomation();
    await this.openCreateDropdown();
    await this.selectFormFromDropdown();
  }

  async isAutomationMenuVisible(): Promise<boolean> {
    return this.automationMenuItem.isVisible();
  }

  async isCreateDropdownVisible(): Promise<boolean> {
    return this.createDropdown.isVisible();
  }
}
