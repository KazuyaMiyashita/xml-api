import { expect, test } from "@playwright/test";

test.describe("Schema Strictness", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Unsupported elements (ul/li) are not rendered as structural nodes", async ({
    page,
  }) => {
    const wysiwyg = page.locator(".ProseMirror");
    const codeEditor = page.locator(".cm-content");

    // Inject unsupported XML via CodeEditor
    const xmlWithList = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>Test</title></head>
  <body>
    <h1>List Test</h1>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </body>
</html>`;

    await codeEditor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Delete");
    await page.keyboard.insertText(xmlWithList);

    // Wait for WYSIWYG update
    await expect(wysiwyg.locator("h1")).toHaveText("List Test", {
      timeout: 5000,
    });

    // Check that UL/LI are NOT present in WYSIWYG DOM
    // ProseMirror should have stripped them or unwrapped them.
    // If unwrapped, "Item 1" and "Item 2" might appear as text nodes, maybe merged or separated?
    // Since 'text' is inline and needs a parent block, and 'doc' only allows blocks.
    // If 'ul' is ignored, 'li' is ignored.
    // The text "Item 1" is inline.
    // If it's not wrapped in a block (p, h1, section), it might be dropped if 'doc' doesn't allow top-level text.
    // Our schema: doc: { content: "block+" }.
    // So text at top level (body children) is invalid.

    // Expectation: The list items might be lost or wrapped in a default block if PM is smart?
    // Or dropped.

    const ul = wysiwyg.locator("ul");
    await expect(ul).toBeHidden();

    const li = wysiwyg.locator("li");
    await expect(li).toBeHidden();

    // Check if text is present?
    // This depends on PM parser behavior.
    // If it drops them, that's "strictness" applied.
  });
});
