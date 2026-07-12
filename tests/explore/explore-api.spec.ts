import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { AutomationListPage } from '../../src/pages/AutomationListPage';
import { FormBuilderPage } from '../../src/pages/FormBuilderPage';
import { getCredentials, formName } from '../../src/utils/testData';
import { SELECTORS } from '../../src/utils/constants';
import * as fs from 'fs';
import * as path from 'path';

test('Explore API Payloads', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const listPage = new AutomationListPage(page);
  const builderPage = new FormBuilderPage(page);
  
  const { username, password } = getCredentials();
  
  const payloads: Record<string, any> = {};

  // Intercept all API requests
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    
    if (url.includes('/v2/repository/files') && (method === 'POST' || method === 'PUT')) {
      const postData = request.postDataJSON();
      console.log(`\n[API INTERCEPT] ${method} ${url}`);
      
      if (url.endsWith('/content')) {
        console.log('CONTENT PAYLOAD CAPTURED!');
        payloads['content_' + Date.now()] = postData;
      } else if (url.endsWith('/dependencies')) {
        console.log('DEPENDENCIES PAYLOAD CAPTURED!');
        payloads['deps_' + Date.now()] = postData;
      } else {
        console.log('FILE CREATION PAYLOAD CAPTURED!');
        payloads['create_' + Date.now()] = postData;
      }
    }
  });

  // Login
  await loginPage.goto();
  await loginPage.login(username, password);

  // Navigate & Create Form
  await listPage.navigateAndCreateForm();
  await builderPage.createForm(formName());
  // Create Process
  await listPage.navigateToAutomation();
  await page.locator(SELECTORS.NAV.CREATE_DROPDOWN).click();
  await page.getByRole('menuitem', { name: 'Process' }).click();
  
  await page.locator(SELECTORS.FORM_MODAL.NAME_INPUT).fill('Process_UC2_' + Date.now());
  await page.getByRole('button', { name: 'Create & edit' }).click();
  
  // Wait for builder
  const processFrame = page.frameLocator('iframe.modulepage-frame');
  
  // Drag Form Task
  const formTaskSource = processFrame.locator('.editor-palette-item').filter({ hasText: 'Form Task' });
  const processCanvas = processFrame.locator('.flowcanvas');
  await formTaskSource.dragTo(processCanvas);
  
  // Select the created form in the properties panel
  // (We'll just save it to trigger the payload)
  await processFrame.getByRole('button', { name: 'Save' }).click();
  
  await page.waitForTimeout(5000);

  // Dump payloads to a file
  fs.writeFileSync(
    path.join(__dirname, 'api-payloads.json'), 
    JSON.stringify(payloads, null, 2)
  );
  
  console.log('Payloads saved to tests/explore/api-payloads.json');
});
