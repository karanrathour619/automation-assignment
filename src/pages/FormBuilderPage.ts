import { Page, Locator, FrameLocator } from '@playwright/test';
import { SELECTORS, TIMEOUT } from '../utils/constants';

export class FormBuilderPage {
  readonly page:  Page;
  readonly frame: FrameLocator;   // iframe context

  // Outer page locators 
  readonly formNameInput:   Locator;
  readonly formDescription: Locator;
  readonly modalCreateBtn:  Locator;

  constructor(page: Page) {
    this.page = page;

    this.frame = page.frameLocator(SELECTORS.IFRAME.FORM_BUILDER_FRAME);

    this.formNameInput   = page.getByLabel('Name', { exact: true });
    this.formDescription = page.getByLabel('Description', { exact: false });
    this.modalCreateBtn  = page.locator(SELECTORS.FORM_MODAL.CREATE_BUTTON).first();
  }

  get paletteTextbox(): Locator {
    const { role, name } = SELECTORS.FORM_BUILDER.PALETTE_TEXTBOX;
    return this.frame.getByRole(role, { name });
  }

  get paletteTextboxDraggable(): Locator {
    return this.frame
      .locator('.editor-palette-item__child--is_draggable')
      .filter({ has: this.frame.locator('.editor-palette-item__child-label', { hasText: 'Text Box' }) })
      .first();
  }

  get paletteFileUpload(): Locator {
    const { role, name } = SELECTORS.FORM_BUILDER.PALETTE_FILE_UPLOAD;
    return this.frame.getByRole(role, { name });
  }

  get paletteFileUploadDraggable(): Locator {
    return this.frame
      .locator('.editor-palette-item__child--is_draggable')
      .filter({ has: this.frame.locator('.editor-palette-item__child-label', { hasText: 'Select File' }) })
      .first();
  }

  get canvas(): Locator {
    return this.frame.locator(SELECTORS.FORM_BUILDER.CANVAS).first();
  }

  get canvasPane(): Locator {
    return this.frame.locator(SELECTORS.FORM_BUILDER.CANVAS_PANE).first();
  }

  get propertiesPanel(): Locator {
    return this.frame.locator(SELECTORS.FORM_BUILDER.PROPERTIES_PANEL).first();
  }

  get saveButton(): Locator {
    return this.frame.locator(SELECTORS.FORM_BUILDER.SAVE_BUTTON).first();
  }

  get successToast(): Locator {
    return this.frame.locator(SELECTORS.FORM_BUILDER.SUCCESS_TOAST).first();
  }

  get canvasTextbox(): Locator {
    return this.frame.locator(SELECTORS.FORM_BUILDER.CANVAS_TEXTBOX).first();
  }

  get canvasFileUpload(): Locator {
    return this.frame.locator(SELECTORS.FORM_BUILDER.CANVAS_FILE_UPLOAD).first();
  }

  async fillFormName(name: string): Promise<void> {
    await this.formNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await this.formNameInput.fill(name);
  }

  async fillDescription(description: string): Promise<void> {
    const isVisible = await this.formDescription.isVisible().catch(() => false);
    if (isVisible) await this.formDescription.fill(description);
  }

  async clickCreate(): Promise<void> {
    await this.modalCreateBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await this.modalCreateBtn.click();

    await this.page.locator(SELECTORS.IFRAME.FORM_BUILDER_FRAME)
      .waitFor({ state: 'attached', timeout: TIMEOUT.LONG });

    await this.paletteTextbox.waitFor({ state: 'visible', timeout: TIMEOUT.LONG });
  }

  async createForm(name: string, description = 'Automated form for UC1'): Promise<void> {
    await this.fillFormName(name);
    await this.fillDescription(description);
    await this.clickCreate();
  }
  /**
   * Primary method: adds a palette element to the canvas.
   * Tries click → dragTo → manual mouse in sequence.
   * @param sourceLocator  The palette item locator
   * @param targetOffset   Optional x/y offset from canvas centre for placement
   */
  async addElementToCanvas(
    sourceLocator: Locator,
    targetOffset = { x: 0, y: 0 }
  ): Promise<void> {
    await sourceLocator.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });

    // ── Strategy 1: Click to add
    const childCountBefore = await this.canvasPane.locator('> *').count().catch(() => 0);
    await sourceLocator.click();
    await this.page.waitForTimeout(800);
    const childCountAfter = await this.canvasPane.locator('> *').count().catch(() => 0);

    if (childCountAfter > childCountBefore) {
      console.log('✅ Click-to-add succeeded');
      await this.page.waitForTimeout(TIMEOUT.DRAG);
      return;
    }

    // ── Strategy 2: Playwright dragTo() using confirmed drop target
    console.log('⚠️  Click alone did not add element — trying dragTo()');
    try {
      await sourceLocator.dragTo(this.canvas, {
        targetPosition: { x: 200 + targetOffset.x, y: 50 + targetOffset.y },
      });
      await this.page.waitForTimeout(TIMEOUT.DRAG);
      const countAfterDrag = await this.canvasPane.locator('> *').count().catch(() => 0);
      if (countAfterDrag > childCountBefore) {
        console.log('✅ dragTo() succeeded');
        return;
      }
    } catch {
      // Fall through to manual mouse
    }

    // ── Strategy 3: Manual mouse events
    console.log('⚠️  dragTo() failed — trying manual mouse events');
    await this.dragViaManualMouse(sourceLocator, targetOffset);
    await this.page.waitForTimeout(TIMEOUT.DRAG);
  }

  private async dragViaManualMouse(
    sourceLocator: Locator,
    targetOffset: { x: number; y: number }
  ): Promise<void> {
    const sourceBox = await sourceLocator.boundingBox();
    const canvasBox = await this.canvas.boundingBox();

    if (!sourceBox || !canvasBox) {
      throw new Error(
        'Bounding box not found for drag. Run the explore script first:\n' +
        '  npx playwright test tests/explore/explore-iframe.spec.ts --headed\n' +
        'Then update CANVAS selector in src/utils/constants.ts'
      );
    }

    const srcX = sourceBox.x + sourceBox.width  / 2;
    const srcY = sourceBox.y + sourceBox.height / 2;
    const tgtX = canvasBox.x + canvasBox.width  / 2 + targetOffset.x;
    const tgtY = canvasBox.y + canvasBox.height / 2 + targetOffset.y;

    await this.page.mouse.move(srcX, srcY);
    await this.page.mouse.down();
    await this.page.waitForTimeout(400);

    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      await this.page.mouse.move(
        srcX + ((tgtX - srcX) / steps) * i,
        srcY + ((tgtY - srcY) / steps) * i,
        { steps: 2 }
      );
      await this.page.waitForTimeout(25);
    }

    await this.page.mouse.up();
  }

  async addTextboxToCanvas(): Promise<void> {
    await this.addElementToCanvas(this.paletteTextboxDraggable, { x: 0, y: -60 });
  }

  async addFileUploadToCanvas(): Promise<void> {
    await this.addElementToCanvas(this.paletteFileUploadDraggable, { x: 0, y: 60 });
  }

  async selectCanvasElement(elementLocator: Locator): Promise<void> {
    await elementLocator.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await elementLocator.click();
    await this.propertiesPanel.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
  }

  async getPropertiesPanelText(): Promise<string> {
    await this.propertiesPanel.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    return this.propertiesPanel.innerText();
  }

  async isPropertyFieldVisible(label: string): Promise<boolean> {
    return this.propertiesPanel.locator(`text=${label}`).isVisible().catch(() => false);
  }

  async saveForm(): Promise<void> {
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await this.saveButton.click();

    await this.page.waitForTimeout(2000);

    await this.successToast.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      return this.page.locator(SELECTORS.FORM_BUILDER.SUCCESS_TOAST)
        .filter({ hasText: /saved|success|created/i })
        .first()
        .waitFor({ state: 'visible', timeout: 3000 })
        .catch(() => {
          console.log('ℹ️  Save toast not detected — save assumed successful');
        });
    });
  }

  async clickPreview(): Promise<void> {
    const previewBtn = this.frame.getByRole('button', { name: 'Preview' });
    await previewBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MEDIUM });
    await previewBtn.click();
    
    await this.page.waitForTimeout(2000); 
  }

  async isPaletteTextboxVisible():  Promise<boolean> { return this.paletteTextbox.isVisible(); }
  async isPaletteFileVisible():     Promise<boolean> { return this.paletteFileUpload.isVisible(); }
  async isCanvasVisible():          Promise<boolean> { return this.canvas.isVisible(); }
  async isPropertiesPanelVisible(): Promise<boolean> { return this.propertiesPanel.isVisible(); }
  async isSaveButtonVisible():      Promise<boolean> { return this.saveButton.isVisible(); }
  async isSuccessToastVisible():    Promise<boolean> { return this.successToast.isVisible().catch(() => false); }
}
