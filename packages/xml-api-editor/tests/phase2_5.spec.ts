import { expect, test } from "@playwright/test";

test.describe("Phase 2.5: Bug Fixes & Improvements", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`BROWSER: ${msg.text()}`));
    await page.goto("http://localhost:5173");
  });

  test("Bug Fix (2): CodeEditor Input Duplication Check", async ({ page }) => {
    const codeEditor = page.locator(".cm-content");
    await codeEditor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");

    // Type sequence and check for duplicates
    await page.keyboard.type("abc");
    await expect(codeEditor).toHaveText("abc", { timeout: 10000 });

    await page.keyboard.type("def");
    await expect(codeEditor).toHaveText("abcdef", { timeout: 10000 });
  });

  test("Bug Fix (3): DOM Stability during rapid editing", async ({ page }) => {
    const codeEditor = page.locator(".cm-content");
    await codeEditor.click();

    // Rapidly type and delete
    for (let i = 0; i < 10; i++) {
      await page.keyboard.type("quicktest");
      await page.keyboard.press("Meta+a");
      await page.keyboard.press("Backspace");
    }

    // If we reach here without crash (NotFoundError), it's stable
    await expect(codeEditor).toBeVisible();
    await page.keyboard.type("Stable");
    await expect(codeEditor).toContainText("Stable");
  });

  test("Feature Fix: Strong tag rendering", async ({ page }) => {
    const wysiwyg = page.locator(".ProseMirror");
    const boldBtn = page.getByText("Bold");

    const firstP = wysiwyg.locator("p").first();
    await firstP.click();
    await page.keyboard.press("Meta+a"); // Select all in paragraph or doc

    await boldBtn.click();

    // Check if strong element is created and visible in WYSIWYG
    const strong = wysiwyg.locator("strong").first();
    await expect(strong).toBeVisible();

    // Verify CSS (bold)
    const fontWeight = await strong.evaluate(
      (el) => window.getComputedStyle(el).fontWeight,
    );
    expect(parseInt(fontWeight) >= 600 || fontWeight === "bold").toBe(true);
  });
});
