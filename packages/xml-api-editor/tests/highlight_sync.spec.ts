import { test, expect } from '@playwright/test';

test.describe('CodeEditor Highlight Sync', () => {
  test('highlight should be synchronized immediately after typing', async ({ page }) => {
    // 1. Setup
    await page.goto('http://localhost:5173');
    
    // Wait for editor to load
    await expect(page.locator('.cm-content')).toBeVisible();

    // Focus CodeEditor
    const editor = page.locator('.cm-content');
    await editor.click();

    // Clear and set initial content: <root>text</root>
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.insertText('<root>text</root>');

    // Initial check: first char "<" should have syntax-tag class
    // CodeMirror structure: .cm-line > span...
    const firstLine = editor.locator('.cm-line').first();
    // Verify initial state
    await expect(firstLine).toHaveText('<root>text</root>');
    
    // 2. Insert char at the beginning
    await page.keyboard.press('Home');
    await page.keyboard.insertText('A');

    // 3. Verify immediate state
    // "A" should NOT have 'syntax-tag' class.
    // However, if CST is outdated (still thinks tag starts at 0), "A" will inherit the tag color.
    
    const spanWithA = firstLine.locator('span').filter({ hasText: 'A' }).first();
    await expect(spanWithA).not.toHaveClass(/syntax-tag/);
    
    // Debug info
    const html = await firstLine.innerHTML();
    console.log('Editor Line HTML:', html);
  });
});
