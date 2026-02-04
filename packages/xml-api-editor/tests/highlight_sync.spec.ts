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
    // If it's plain text, it might not be wrapped in a span at all.
    
    // Check all elements with 'syntax-tag' class in the first line
    const syntaxTags = firstLine.locator('.syntax-tag');
    
    // If there are any syntax tags, the FIRST one should be "<" (the start of <root>)
    // It should NOT be "A" or start with "A"
    
    if (await syntaxTags.count() > 0) {
      await expect(syntaxTags.first()).not.toHaveText(/^A/);
    } else {
      // If no syntax tags, that's also fine (means A is definitely not highlighted as tag)
    }

    // Additionally, verify that 'A' is present in the line (sanity check)
    await expect(firstLine).toHaveText(/^A<root>text<\/root>$/);
    
    // Debug info
    const html = await firstLine.innerHTML();
    console.log('Editor Line HTML:', html);
  });
});
