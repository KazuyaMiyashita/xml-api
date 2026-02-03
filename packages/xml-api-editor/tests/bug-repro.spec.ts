import { test, expect } from "@playwright/test";

test.describe("Bug Reproduction & Feature Verification", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`BROWSER: ${msg.text()}`));
    await page.goto("http://localhost:5173");
    // Wait for the editors to load (assuming content loads from fetch)
    await expect(page.locator(".cm-content").first()).toBeVisible();
    await expect(page.locator(".ProseMirror").first()).toBeVisible();
  });

  test("Bug Fix (2): CodeEditor Input Duplication Check", async ({ page }) => {
    // Locate the CodeEditor contentEditable div
    const codeEditor = page.locator(".cm-content");

    // Focus and clear content (simulating initial clean state or finding a clean spot)
    // Since the editor loads xml, we'll append to the end or clear.
    // Let's clear it for this test to be sure.
    await codeEditor.click();
    await codeEditor.press("Meta+a");
    await codeEditor.press("Backspace");

    await expect(codeEditor).toHaveText("");

    // Type 'a'
    await codeEditor.pressSequentially("a");
    // Expect 'a', not 'aa'
    await expect(codeEditor).toHaveText("a");

    // Type 'b'
    await codeEditor.pressSequentially("b");
    // Expect 'ab', not 'ababa'
    await expect(codeEditor).toHaveText("ab");

    // Type 'c'
    await codeEditor.pressSequentially("c");
    await expect(codeEditor).toHaveText("abc");
  });

  test("Bug Fix (1): WYSIWYG -> Code Sync", async ({ page }) => {
    const wysiwyg = page.locator(".ProseMirror");
    const codeEditor = page.locator(".cm-content");

    const firstP = wysiwyg.locator("p").first();
    await expect(firstP).toBeVisible({ timeout: 10000 });

    const originalText = await firstP.innerText();
    console.log("Original Text in WYSIWYG span:", originalText);

    // In ProseMirror, we type directly
    await firstP.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Edited");

    console.log('Typed " Edited", waiting for CodeEditor sync...');

    // Check if CodeEditor reflects the change
    await expect(codeEditor).toContainText("Edited", { timeout: 15000 });
    console.log('Sync verified: "Edited" found in CodeEditor');
  });

  test("Feature: Wrap with Strong", async ({ page }) => {
    const wysiwyg = page.locator(".ProseMirror");
    const codeEditor = page.locator(".cm-content");
    const boldBtn = page.getByText("Bold");

    const firstP = wysiwyg.locator("p").first();

    await firstP.click();
    // Select a word using double click simulation or keyboard
    await page.keyboard.press("Meta+a");

    const selectedText = await page.evaluate(() => {
      const sel = window.getSelection();
      return sel ? sel.toString() : "";
    });
    console.log("Selected Text:", selectedText);

    await boldBtn.click();
    console.log("Clicked Bold, waiting for CodeEditor sync...");

    // Expect the selection to be wrapped in strong
    await expect(codeEditor).toContainText("<strong>", { timeout: 15000 });

    // Check if WYSIWYG has the strong tag rendered
    const strongInWysiwyg = wysiwyg.locator("strong").first();
    await expect(strongInWysiwyg).toBeVisible();
    console.log("Strong tag is visible in WYSIWYG");
  });
});
