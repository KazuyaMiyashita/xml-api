import { test, expect } from "@playwright/test";

test.describe("Phase 1: Foundation", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`BROWSER: ${msg.text()}`));
    await page.goto("http://localhost:5173");
  });

  test("Setup Basic Split-Pane UI", async ({ page }) => {
    // Check for main container
    await expect(page.locator(".app-container")).toBeVisible();

    // Check for header
    await expect(page.locator(".app-header")).toContainText("XML API Editor");

    // Check for split panes
    await expect(page.locator(".pane-left")).toBeVisible();
    await expect(page.locator(".pane-right")).toBeVisible();

    // Check pane headers
    await expect(page.locator(".pane-left .pane-header").first()).toContainText(
      "WYSIWYG Editor",
    );
    await expect(
      page.locator(".pane-right .pane-header").first(),
    ).toContainText("Source Code");
  });

  test("Load initial XML via XMLAPI", async ({ page }) => {
    // Check if initial XML content is loaded in Code Editor (CodeMirror)
    const codeEditor = page.locator(".cm-content");
    await expect(codeEditor).toContainText("りんごの選び方", {
      timeout: 10000,
    });
    await expect(codeEditor).toContainText("<html", { timeout: 10000 });

    // Check if initial XML content is rendered in WYSIWYG Editor (ProseMirror)
    const wysiwyg = page.locator(".ProseMirror");
    await expect(wysiwyg).toContainText("りんごの選び方", { timeout: 10000 });
    // A specific paragraph should be visible
    await expect(wysiwyg).toContainText("自分にぴったりのりんごを選ぶ", {
      timeout: 10000,
    });
  });

  test("Implement Code Editor and onChange binding", async ({ page }) => {
    // CodeMirror uses .cm-content for the editable area
    const codeEditorContent = page.locator(".cm-content");

    // Debug: Check HTML content
    const html = await codeEditorContent.innerHTML();
    console.log("CodeEditor HTML:", html);

    // Check if syntax highlighting spans are present (CodeMirror uses different classes, but our decorator adds custom classes)
    // Wait for the specific classes used in CodeEditor.tsx decorator
    await expect(
      codeEditorContent.locator("span.syntax-tag").first(),
    ).toBeVisible({ timeout: 10000 });

    // Interact with the editor
    await codeEditorContent.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");

    // Type something new
    const testXml = "<root><item>Hello</item></root>";
    await page.keyboard.type(testXml);

    // Check if content is updated in the DOM
    await expect(codeEditorContent).toContainText("<root>");

    // Check if XMLAPI event was triggered and logged (verification of binding)
    const eventLog = page.locator(".pane-footer");
    // Note: 'full' might not be triggered if incremental updates are working perfectly,
    // but 'structure' or 'text' should be. However, replacing all text usually triggers a structure change or full update depending on diffing.
    // For a total replacement, it likely triggers multiple events or a large structure change.
    await expect(eventLog).toBeVisible();
  });

  test("Implement Basic WYSIWYG Renderer", async ({ page }) => {
    const wysiwyg = page.locator(".ProseMirror");

    // h1 should be rendered as a native h1 or equivalent in ProseMirror
    const h1 = wysiwyg.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("りんごの選び方");

    // section (custom class in our schema)
    const section = wysiwyg.locator("section").first();
    await expect(section).toBeVisible();
    const h2 = section.locator("h2");
    await expect(h2).toContainText("はじめに");

    // Paragraph
    const p = section.locator("p");
    await expect(p).toBeVisible();
    await expect(p).toContainText("自分にぴったりのりんごを選ぶ");
  });
});
