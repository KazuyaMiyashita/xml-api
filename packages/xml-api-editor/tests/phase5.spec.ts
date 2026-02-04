import { test, expect } from "@playwright/test";

test.describe("Phase 5: Quality & Stability", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`BROWSER: ${msg.text()}`));
    await page.goto("http://localhost:5173");
  });

  test("CodeEditor: Enter key should create new line", async ({ page }) => {
    const codeEditor = page.locator(".cm-content");

    // Click inside the editor
    await codeEditor.click();
    
    // Type some text
    await page.keyboard.type("Before");
    // Press Enter
    await page.keyboard.press("Enter");
    // Type more text
    await page.keyboard.type("After");

    // Get text content
    const text = await codeEditor.innerText();
    
    // Check if it contains newline (CodeMirror usually renders lines as separate divs, but innerText might join them)
    // Actually, CodeMirror structure: .cm-line
    const lines = await codeEditor.locator(".cm-line").allInnerTexts();
    
    // We expect "Before" and "After" to be on different lines or at least separated
    // Since we are appending to the end of the file (or wherever the cursor was), let's be more specific.
    // Let's clear and type fresh to be sure.
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("Line1");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Line2");

    const newLines = await codeEditor.locator(".cm-line").allInnerTexts();
    expect(newLines).toEqual(expect.arrayContaining(["Line1", "Line2"]));
    expect(newLines.length).toBeGreaterThanOrEqual(2);
  });

  test("CodeEditor: Typing '<' should not trigger auto-completion or tag injection", async ({ page }) => {
    const codeEditor = page.locator(".cm-content");
    
    await codeEditor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    
    // Type '<'
    await page.keyboard.type("<");
    
    // Wait a bit to see if any magic happens
    await page.waitForTimeout(500);

    const text = await codeEditor.innerText();
    // Should be just "<" (or maybe invisible char for line), but definitely not "<p>&gt;</p>"
    // CodeMirror line text:
    const lineText = await codeEditor.locator(".cm-line").first().innerText();
    
    expect(lineText.trim()).toBe("<");
    
    // Also check WYSIWYG side -> Should show error or broken state, NOT render garbage
    const wysiwyg = page.locator(".pane-left .pane-body");
    // Depending on implementation, it might show "XML Error" or similar.
    // For now, let's just assert it doesn't crash or show weird <p> tags if the model is broken.
  });

  test("WYSIWYG: Should show error state for invalid XML", async ({ page }) => {
    const codeEditor = page.locator(".cm-content");
    const wysiwygBody = page.locator(".pane-left .pane-body");

    await codeEditor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    
    // Type invalid XML
    await page.keyboard.type("<broken>");

    // Expect WYSIWYG to indicate error
    // We haven't implemented the error message yet, but this test will verify when we do.
    // For now, let's assume we want to see text "Invalid XML" or similar, or at least NOT the WYSIWYG editor
    
    // This expectation will fail currently
    await expect(wysiwygBody).toContainText("Invalid XML", { timeout: 2000 });
  });
});
