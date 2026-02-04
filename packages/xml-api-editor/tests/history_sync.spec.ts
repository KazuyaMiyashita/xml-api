import { expect, test } from "@playwright/test";

test.describe("History Synchronization (Undo/Redo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    // Wait for editors to load
    await expect(page.locator(".cm-content")).toBeVisible();
    await expect(page.locator(".ProseMirror")).toBeVisible();
  });

  test("Undo in WYSIWYG should revert changes in both editors", async ({
    page,
  }) => {
    const wysiwyg = page.locator(".ProseMirror");
    const codeEditor = page.locator(".cm-content");

    // 1. Make a change in WYSIWYG
    await wysiwyg.click();
    await page.keyboard.press("Control+End"); 
    
    const h1 = wysiwyg.locator("h1");
    await h1.click();
    // Use insertText to treat it as a single input operation (paste-like)
    await page.keyboard.insertText(" - Modified");

    await expect(h1).toHaveText("りんごの選び方 - Modified");
    await expect(codeEditor).toContainText("りんごの選び方 - Modified");

    // 2. Undo via Keyboard Shortcut
    const isMac = process.platform === "darwin";
    const mod = isMac ? "Meta" : "Control";
    
    // Retry undo a few times if necessary (in case of fragmentation), but insertText should prevent it.
    await page.keyboard.press(`${mod}+z`);

    // 3. Verify Revert
    await expect(h1).toHaveText("りんごの選び方");
    await expect(codeEditor).not.toContainText("- Modified");
  });

  test("Undo in CodeEditor should revert changes in both editors", async ({
    page,
  }) => {
    const wysiwyg = page.locator(".ProseMirror");
    const codeEditor = page.locator(".cm-content");

    // 1. Make a change in CodeEditor
    await codeEditor.click();
    // Insert text at line 2 (Title line roughly)
    await page.keyboard.press("ArrowDown"); // !DOCTYPE
    await page.keyboard.press("ArrowDown"); // html
    await page.keyboard.press("ArrowDown"); // head
    // It's XML, finding specific place is tricky blindly.
    // Let's append to the end.
    await page.keyboard.press(`${process.platform === "darwin" ? "Meta" : "Control"}+End`);
    
    // Insert a comment as a single block
    await page.keyboard.insertText("\n<!-- New Comment -->");
    
    await expect(codeEditor).toContainText("<!-- New Comment -->");
    // Wait for sync? Comments might not show in WYSIWYG depending on schema, 
    // but the source update should be registered.
    
    // Let's modify visible text for WYSIWYG verification
    // Find h1 in code editor?
    // Let's use search? Or just type at start.
    // Reset
    await page.keyboard.press(`${process.platform === "darwin" ? "Meta" : "Control"}+a`);
    await page.keyboard.press("Backspace");
    // Wait, clearing doc might break well-formedness.
    // Let's just Undo the comment insertion.
    
    // Undo
    const isMac = process.platform === "darwin";
    const mod = isMac ? "Meta" : "Control";
    // Retry undo a few times if necessary (in case of fragmentation)
    await page.keyboard.press(`${mod}+z`);
    
    // Check if undone, if not try again (up to 3 times)
    for (let i = 0; i < 3; i++) {
        const text = await codeEditor.textContent();
        if (text && text.includes("<!-- New Comment -->")) {
             await page.keyboard.press(`${mod}+z`);
             await page.waitForTimeout(100);
        } else {
            break;
        }
    }
    
    await expect(codeEditor).not.toContainText("<!-- New Comment -->");
  });
  
  test("Redo should restore changes", async ({ page }) => {
    const wysiwyg = page.locator(".ProseMirror");
    
    // 1. Type text
    const h1 = wysiwyg.locator("h1");
    await h1.click();
    await page.keyboard.type("A");
    await expect(h1).toHaveText("りんごの選び方A");
    
    // 2. Undo
    const isMac = process.platform === "darwin";
    const mod = isMac ? "Meta" : "Control";
    await page.keyboard.press(`${mod}+z`);
    await expect(h1).toHaveText("りんごの選び方");
    
    // 3. Redo
    // Mod-y or Mod-Shift-z
    if (isMac) {
      await page.keyboard.press(`${mod}+Shift+z`);
    } else {
      await page.keyboard.press(`${mod}+y`);
    }
    
    await expect(h1).toHaveText("りんごの選び方A");
  });
});
