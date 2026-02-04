import { test, expect } from '@playwright/test';

test.describe('WYSIWYG Recovery from Invalid XML', () => {
  test('should restore content after Invalid XML state', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const codeEditor = page.locator('.cm-content');
    const wysiwyg = page.locator('.ProseMirror');
    
    // 1. Initial State: Valid XML
    await expect(wysiwyg).toContainText('りんごの選び方');
    
    // 2. Introduce Invalid XML
    // Insert '<' at the beginning of the text content "りんご..."
    // Locate the place in CodeEditor.
    // Assuming the text is in <title> or <h1>. Let's append '<' to the end of document first for simplicity,
    // or insert in a text node.
    
    // Let's modify Source Code directly via CodeMirror interaction
    await codeEditor.click();
    // Go to a known text location (e.g. inside h1)
    // <root>...<h1>りんご...</h1>...</root>
    // We'll just type '<' at the very beginning of file to make it invalid immediately?
    // "<" + "<?xml ..." -> Invalid.
    await page.keyboard.press('Home');
    await page.keyboard.press('Home'); // Ensure start
    await page.keyboard.type('<');
    
    // 3. Verify Invalid State
    await expect(page.locator('.editor-error')).toBeVisible();
    await expect(wysiwyg).not.toBeVisible();
    
    // 4. Recovery
    await page.keyboard.press('Backspace');
    
    // 5. Verify Valid State
    await expect(page.locator('.editor-error')).not.toBeVisible();
    await expect(wysiwyg).toBeVisible();
    
    // This is the failing point: Content should be restored
    await expect(wysiwyg).toContainText('りんごの選び方');
  });
});
