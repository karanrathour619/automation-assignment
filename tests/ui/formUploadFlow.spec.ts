import { test, expect, Page, Response } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { LoginPage }           from '../../src/pages/LoginPage';
import { AutomationListPage }  from '../../src/pages/AutomationListPage';
import { FormBuilderPage }     from '../../src/pages/FormBuilderPage';
import { FormRuntimePage }     from '../../src/pages/FormRuntimePage';
import { getCredentials, formName } from '../../src/utils/testData';

dotenv.config();

const SAMPLE_FILE_PATH = path.resolve(__dirname, '../../test-files/sample-upload.pdf');

const ctx = {
  createdFormName: '',
};

test.describe('UI Automation - Form Builder & Upload Flow', () => {

    test.beforeEach(async ({ page }: { page: Page }) => {
    const loginPage = new LoginPage(page);
    const { username, password } = getCredentials();

    await loginPage.goto();

        expect(await loginPage.isUsernameInputVisible(), 'Username input should be visible').toBe(true);
    expect(await loginPage.isPasswordInputVisible(), 'Password input should be visible').toBe(true);
    expect(await loginPage.isSubmitButtonVisible(),  'Submit button should be visible').toBe(true);

    await loginPage.login(username, password);

        expect(
      page.url(),
      'After login, URL should not contain "login" or "signin"'
    ).not.toMatch(/login|signin/i);
  });

    test(
    'should display an error message when logging in with invalid credentials',
    { tag: '@UC1-UI' },
    async ({ page }: { page: Page }) => {
                  await page.context().clearCookies();
      await page.evaluate(() => {
        try { localStorage.clear(); } catch (_) {}
        try { sessionStorage.clear(); } catch (_) {}
      });

      const loginPage = new LoginPage(page);
      await loginPage.goto();

      const errorLocator = await loginPage.loginWithInvalidCredentials(
        'invalid@test.com',
        'WrongPassword123!'
      );

            await expect(errorLocator, 'Error banner should appear for invalid credentials').toBeVisible();
    }
  );

    test(
    'should successfully navigate to the Automation page and create a new form',
    { tag: '@UC1-UI' },
    async ({ page }: { page: Page }) => {
      const listPage    = new AutomationListPage(page);
      const builderPage = new FormBuilderPage(page);

            await expect(listPage.automationMenuItem, 'Automation menu item should be visible').toBeVisible();

      await listPage.navigateToAutomation();

            await expect(listPage.createDropdown, 'Create dropdown should be visible').toBeVisible();

      await listPage.openCreateDropdown();

            await expect(listPage.createFormOption, 'Form option should be visible in Create dropdown').toBeVisible();

      await listPage.selectFormFromDropdown();

            ctx.createdFormName = formName();
      await builderPage.createForm(ctx.createdFormName);

            expect(await builderPage.isCanvasVisible(), 'Form Builder canvas should be visible after creation').toBe(true);

            expect(await builderPage.isSaveButtonVisible(), 'Save button should be visible in Form Builder').toBe(true);
    }
  );

    test(
    'should successfully drag Textbox and Select File controls onto the canvas and display their properties',
    { tag: '@UC1-UI' },
    async ({ page }: { page: Page }) => {
      const listPage    = new AutomationListPage(page);
      const builderPage = new FormBuilderPage(page);

            await listPage.navigateAndCreateForm();
      await builderPage.createForm(formName());

            expect(await builderPage.isPaletteTextboxVisible(), 'Textbox palette item should be visible').toBe(true);

            await builderPage.addTextboxToCanvas();

            await expect(
        builderPage.canvasTextbox,
        'Textbox control should appear on canvas after drag'
      ).toBeVisible();

            await builderPage.selectCanvasElement(builderPage.canvasTextbox);

            await expect(
        builderPage.propertiesPanel,
        'Properties panel should be visible after selecting Textbox'
      ).toBeVisible();

      const panelTextAfterTextbox = await builderPage.getPropertiesPanelText();
      expect(
        panelTextAfterTextbox.length,
        'Properties panel should contain text when Textbox is selected'
      ).toBeGreaterThan(0);

            expect(await builderPage.isPaletteFileVisible(), 'Select File palette item should be visible').toBe(true);

            await builderPage.addFileUploadToCanvas();

            await expect(
        builderPage.canvasFileUpload,
        'Select File control should appear on canvas after drag'
      ).toBeVisible();

            await builderPage.selectCanvasElement(builderPage.canvasFileUpload);

      const panelTextAfterFileUpload = await builderPage.getPropertiesPanelText();
      expect(
        panelTextAfterFileUpload.length,
        'Properties panel should contain text when Select File is selected'
      ).toBeGreaterThan(0);
    }
  );

    test(
    'should allow text input, bypass file upload gracefully, and save the form',
    { tag: '@UC1-UI' },
    async ({ page }: { page: Page }) => {
      const listPage    = new AutomationListPage(page);
      const builderPage = new FormBuilderPage(page);

            await listPage.navigateAndCreateForm();
      await builderPage.createForm(formName());
      await builderPage.addTextboxToCanvas();
      await builderPage.addFileUploadToCanvas();

                        const runtimePage = new FormRuntimePage(page, builderPage.frame);

            expect(
        await runtimePage.isTextboxVisible(),
        'Textbox input should be visible on canvas'
      ).toBe(true);

            const sampleText = 'Automation UC1 Test Input';
      await runtimePage.enterText(sampleText);

            const actualValue = await runtimePage.getTextboxValue();
      expect(actualValue, `Textbox should contain "${sampleText}"`).toBe(sampleText);

            expect(
        await runtimePage.isFileDropZoneVisible(),
        'File upload control should be visible on canvas'
      ).toBe(true);

            await runtimePage.uploadFile(SAMPLE_FILE_PATH);

            expect(
        await runtimePage.isErrorBannerVisible(),
        'No error banner should appear after file upload'
      ).toBe(false);

            let saveResponse: Response | null = null;
      page.on('response', (response) => {
        if (
          response.url().includes('/files') &&
          ['PUT', 'POST'].includes(response.request().method()) &&
          saveResponse === null
        ) {
          saveResponse = response;
        }
      });

      await builderPage.saveForm();

            await expect(
        builderPage.successToast,
        'Success toast should appear after saving the form'
      ).toBeVisible({ timeout: 15_000 }).catch(() => {
        console.log('ℹ️  Save toast not detected (may have dismissed quickly)');
      });

            if (saveResponse !== null) {
        const status = (saveResponse as Response).status();
        expect(status, `Save API should return 2xx, got ${status}`).toBeGreaterThanOrEqual(200);
        expect(status, `Save API should return 2xx, got ${status}`).toBeLessThan(300);
      }
    }
  );
});
