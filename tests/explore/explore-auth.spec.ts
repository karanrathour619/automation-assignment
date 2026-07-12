import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { getCredentials } from '../../src/utils/testData';

test('Explore Auth API', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const { username, password } = getCredentials();
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('auth') || url.includes('login') || url.includes('token') || request.method() === 'POST') {
      console.log(`[AUTH API] ${request.method()} ${url}`);
    }
  });

  await loginPage.goto();
  await loginPage.login(username, password);
  await page.waitForTimeout(5000);
});
