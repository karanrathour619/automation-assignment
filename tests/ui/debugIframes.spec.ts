import { test, expect } from '@playwright/test';
import { AutomationListPage } from '../../src/pages/AutomationListPage';
import { FormBuilderPage } from '../../src/pages/FormBuilderPage';
import { LoginPage } from '../../src/pages/LoginPage';
import { getCredentials } from '../../src/utils/testData';

test('Debug Iframes', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const { username, password } = getCredentials();
  await loginPage.goto();
  await loginPage.login(username, password);

  const listPage = new AutomationListPage(page);
  const builderPage = new FormBuilderPage(page);

  await listPage.navigateAndCreateForm();
  await builderPage.createForm('TestForm' + Date.now());
  await builderPage.addTextboxToCanvas();
  // Check if it has a file input on the main page
  const fileInputs = await page.locator('input[type="file"]').count();
  console.log(`Main Page File Inputs BEFORE Preview:`, fileInputs);
});
