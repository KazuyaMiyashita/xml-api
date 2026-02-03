import { test, expect } from "@playwright/test";

test.describe("Editor Switching Strategy", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test("Switches to MEI Editor for MEI content", async ({ page }) => {
    const codeEditor = page.locator(".cm-content");
    // Select the first pane-header in the left pane
    const paneHeader = page.locator(".pane-left > .pane-header").first();

    // Initial State (XHTML)
    await expect(paneHeader).toHaveText("WYSIWYG Editor");
    await expect(page.locator(".wysiwyg-editor")).toBeVisible();

    // Switch to MEI
    const meiXml = `<?xml version="1.0" encoding="UTF-8"?>
<mei xmlns="http://www.music-encoding.org/ns/mei">
  <meiHead></meiHead>
  <music></music>
</mei>`;

    await codeEditor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Delete");
    await page.keyboard.insertText(meiXml);

    // Verify Switch
    await expect(paneHeader).toHaveText("MEI View", { timeout: 5000 });
    await expect(page.locator("text=🎼 MEI Editor")).toBeVisible();
    await expect(page.locator(".wysiwyg-editor")).toBeHidden();
  });
});
