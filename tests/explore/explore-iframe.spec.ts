/**
 * explore-iframe.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this script to dump the iframe's DOM structure so we can find:
 *   1. The correct canvas DROP ZONE selector
 *   2. What canvas elements look like after they are added
 *   3. The success toast selector
 *
 * HOW TO RUN:
 *   npx playwright test tests/explore/explore-iframe.spec.ts --headed --timeout=120000
 *
 * The script will:
 *   - Log in
 *   - Navigate to Automation → Create Form
 *   - Print the iframe DOM structure to the console
 *   - Try to click "Text Box" palette item (click-to-add approach)
 *   - Print DOM again after click to show canvas element structure
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import * as dotenv      from 'dotenv';
import { LoginPage }          from '../../src/pages/LoginPage';
import { AutomationListPage } from '../../src/pages/AutomationListPage';
import { getCredentials, formName } from '../../src/utils/testData';

dotenv.config();

test('EXPLORE: dump iframe DOM and try click-to-add palette items', async ({ page }) => {
  test.setTimeout(120_000);

  // ── 1. Login ───────────────────────────────────────────────────────────────
  const loginPage = new LoginPage(page);
  const { username, password } = getCredentials();
  await loginPage.goto();
  await loginPage.login(username, password);
  console.log('\n✅ Logged in. URL:', page.url());

  // ── 2. Navigate to Create Form ─────────────────────────────────────────────
  const listPage = new AutomationListPage(page);
  await listPage.navigateAndCreateForm();

  // Fill form name — use getByLabel('Name') to target the modal input exactly
  // (avoids matching the 'Search within subfolders' checkbox behind the modal)
  const nameInput = page.getByLabel('Name', { exact: true });
  await nameInput.waitFor({ state: 'visible', timeout: 15_000 });
  await nameInput.clear();
  await nameInput.fill(formName());
  console.log('✅ Filled form name field');

  // Click 'Create & edit' button — confirmed text from modal screenshot
  const createBtn = page.locator('button:has-text("Create & edit")').first();
  await createBtn.waitFor({ state: 'visible', timeout: 15_000 });
  await createBtn.click();
  console.log('✅ Clicked Create & edit button');

  // ── 3. Wait for iframe ─────────────────────────────────────────────────────
  await page.waitForSelector('iframe', { timeout: 30_000 });
  await page.waitForTimeout(3000); // let the builder fully load
  console.log('\n✅ iframe detected');

  // ── 4. Count and list all iframes ─────────────────────────────────────────
  const iframes = page.locator('iframe');
  const iframeCount = await iframes.count();
  console.log(`\n📦 Total iframes on page: ${iframeCount}`);

  for (let i = 0; i < iframeCount; i++) {
    const src   = await iframes.nth(i).getAttribute('src').catch(() => 'no src');
    const id    = await iframes.nth(i).getAttribute('id').catch(() => 'no id');
    const cls   = await iframes.nth(i).getAttribute('class').catch(() => 'no class');
    console.log(`  iframe[${i}] → id="${id}" class="${cls}" src="${src}"`);
  }

  // ── 5. Dump top-level class names inside the first iframe ─────────────────
  const frame = page.frameLocator('iframe').first();

  const iframeDom = await page.evaluate(() => {
    const iframeEl = document.querySelector('iframe') as HTMLIFrameElement;
    if (!iframeEl?.contentDocument) return 'Could not access iframe contentDocument';

    const body = iframeEl.contentDocument.body;
    if (!body) return 'No body in iframe';

    // Get all elements with class names — sorted by depth
    const elements = Array.from(body.querySelectorAll('[class]')).slice(0, 60);
    return elements.map(el => {
      const depth = el.tagName.toLowerCase();
      const cls   = (el as HTMLElement).className?.toString().substring(0, 80) ?? '';
      const role  = el.getAttribute('role') ?? '';
      const txt   = el.textContent?.trim().substring(0, 40) ?? '';
      return `${depth} | class="${cls}" | role="${role}" | text="${txt}"`;
    }).join('\n');
  });

  console.log('\n📄 iframe DOM (first 60 class-bearing elements):');
  console.log('─'.repeat(80));
  console.log(iframeDom);
  console.log('─'.repeat(80));

  // ── 6. Try click-to-add: click Text Box palette button ────────────────────
  console.log('\n🖱️  Attempting click-to-add on Text Box palette item...');
  try {
    const textBoxBtn = frame.getByRole('button', { name: ' Text Box' });
    await textBoxBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await textBoxBtn.click();
    await page.waitForTimeout(1500);
    console.log('✅ Clicked Text Box palette button');

    // Dump DOM again to see if anything changed on canvas
    const afterClickDom = await page.evaluate(() => {
      const iframeEl = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframeEl?.contentDocument) return '';
      const body = iframeEl.contentDocument.body;
      const elements = Array.from(body.querySelectorAll('[class]')).slice(0, 80);
      return elements.map(el => {
        const depth = el.tagName.toLowerCase();
        const cls   = (el as HTMLElement).className?.toString().substring(0, 80) ?? '';
        const txt   = el.textContent?.trim().substring(0, 40) ?? '';
        return `${depth} | class="${cls}" | text="${txt}"`;
      }).join('\n');
    });

    console.log('\n📄 iframe DOM AFTER clicking Text Box (first 80 elements):');
    console.log('─'.repeat(80));
    console.log(afterClickDom);
    console.log('─'.repeat(80));

  } catch (e) {
    console.log('❌ Click-to-add failed:', e);
    console.log('   → Will need drag-and-drop. Check DOM dump above for drop zone class.');
  }

  // ── 7. Dump ALL droppable / drag-related classes ───────────────────────────
  const dropTargets = await page.evaluate(() => {
    const iframeEl = document.querySelector('iframe') as HTMLIFrameElement;
    if (!iframeEl?.contentDocument) return '';
    const body = iframeEl.contentDocument.body;
    const all  = Array.from(body.querySelectorAll('[class]'));
    const dragRelated = all.filter(el => {
      const c = (el as HTMLElement).className?.toString() ?? '';
      return c.match(/drop|drag|canvas|zone|container|pane|center|middle|stage|editor/i);
    });
    return dragRelated.map(el => {
      const cls  = (el as HTMLElement).className?.toString().substring(0, 100) ?? '';
      const role = el.getAttribute('role') ?? '';
      const txt  = el.textContent?.trim().substring(0, 50) ?? '';
      return `${el.tagName.toLowerCase()} | class="${cls}" | role="${role}" | text="${txt}"`;
    }).join('\n');
  });

  console.log('\n🎯 Drag/drop/canvas related elements in iframe:');
  console.log('─'.repeat(80));
  console.log(dropTargets || '(none found — check class names manually)');
  console.log('─'.repeat(80));

  // ── 8. Pause — keep browser open for manual inspection ────────────────────
  console.log('\n⏸️  Browser is OPEN. Inspect the form builder manually.');
  console.log('   • Try dragging a Text Box onto the canvas');
  console.log('   • Check the console output above for drop zone class names');
  console.log('   • Press Ctrl+C in the terminal when done');
  await page.waitForTimeout(60_000); // keep open for 60s
});
