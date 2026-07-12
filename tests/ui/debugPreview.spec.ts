import { test, expect } from '@playwright/test';
import { AutomationListPage } from '../../src/pages/AutomationListPage';
import { FormBuilderPage } from '../../src/pages/FormBuilderPage';
import * as fs from 'fs';

test('Debug Preview HTML', async ({ page }) => {
  const listPage = new AutomationListPage(page);
  const builderPage = new FormBuilderPage(page);

  await listPage.navigateAndCreateForm();
  await builderPage.createForm('TestForm' + Date.now());
  await builderPage.addTextboxToCanvas();
  await builderPage.addFileUploadToCanvas();
  await builderPage.clickPreview();

  // Print all HTML inside the frame
  const html = await builderPage.frame.locator('body').innerHTML();
  fs.writeFileSync('preview-dom.html', html);
});
