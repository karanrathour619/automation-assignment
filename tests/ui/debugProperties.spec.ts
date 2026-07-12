import { test, expect } from '@playwright/test';
import { AutomationListPage } from '../../src/pages/AutomationListPage';
import { FormBuilderPage } from '../../src/pages/FormBuilderPage';
import { LoginPage } from '../../src/pages/LoginPage';
import { getCredentials } from '../../src/utils/testData';

test('Debug Properties Panel', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const { username, password } = getCredentials();
  await loginPage.goto();
  await loginPage.login(username, password);

  const listPage = new AutomationListPage(page);
  const builderPage = new FormBuilderPage(page);

  await listPage.navigateAndCreateForm();
  await builderPage.createForm('TestForm' + Date.now());
  await builderPage.addFileUploadToCanvas();
  
  // Select the file upload control
  await builderPage.selectCanvasElement(builderPage.canvasFileUpload);
  await page.waitForTimeout(2000);
  
  const text = await builderPage.getPropertiesPanelText();
  console.log("PROPERTIES PANEL TEXT:");
  console.log(text);
});
