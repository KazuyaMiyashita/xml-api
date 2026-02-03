import { test, expect } from '@playwright/test';

test.describe('Phase 2: Synchronization Validation', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    await page.goto('http://localhost:5173');
  });

  test('DOM mutation observation (WYSIWYG -> Code sync)', async ({ page }) => {
    const wysiwyg = page.locator('.ProseMirror');
    const codeEditor = page.locator('.cm-content');
    const eventLog = page.locator('.pane-footer');

    // Find a paragraph to edit
    const firstP = wysiwyg.locator('p').first();
    
    await firstP.click();
    // In ProseMirror, we type directly
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type("Synchronized Content");

    // Verify CodeEditor contains the new text
    await expect(codeEditor).toContainText('Synchronized Content', { timeout: 10000 });
  });

  test('Source updates reflection (Code -> WYSIWYG sync)', async ({ page }) => {
    const wysiwyg = page.locator('.ProseMirror');
    const codeEditor = page.locator('.cm-content');

    await codeEditor.click();
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    
    // Note: ProseMirror schema defines how it parses HTML.
    const newXml = '<html><body><h1>New Heading</h1><p>New Paragraph content</p></body></html>';
    await page.keyboard.type(newXml);

    // Verify WYSIWYG reflects the new structure
    await expect(wysiwyg.locator('h1')).toContainText('New Heading', { timeout: 10000 });
    await expect(wysiwyg.locator('p')).toContainText('New Paragraph content', { timeout: 10000 });
  });

  test('Challenge #2: Solve Cursor Jump / Focus loss', async ({ page }) => {
    const wysiwyg = page.locator('.ProseMirror');
    const firstP = wysiwyg.locator('p').first();
    
    await firstP.click();
    await page.keyboard.press('End');
    
    // Type multiple characters and check if focus is still at the end
    await page.keyboard.type('A');
    await page.keyboard.type('B');
    await page.keyboard.type('C');
    await page.keyboard.type('D');
    
    const text = await firstP.innerText();
    expect(text).toContain('ABCD');
  });
});
