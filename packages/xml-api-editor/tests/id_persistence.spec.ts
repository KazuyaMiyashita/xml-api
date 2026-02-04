import { expect, test } from "@playwright/test";

test.describe("ID Persistence & Purity", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test("Source code should NOT contain data-model-id after WYSIWYG edit", async ({
    page,
  }) => {
    const wysiwyg = page.locator(".ProseMirror");
    const codeEditor = page.locator(".cm-content");

    // 1. Initial State Check
    // WYSIWYG should have h1
    await expect(wysiwyg.locator("h1")).toBeVisible();
    
    // Verify WYSIWYG DOM has data-model-id (Internal verification)
    // We expect the editor to use IDs for partial updates
    const h1Id = await wysiwyg.locator("h1").getAttribute("data-model-id");
    expect(h1Id).toBeTruthy();

    // Source should NOT have it initially
    const initialSource = await codeEditor.textContent();
    expect(initialSource).not.toContain("data-model-id");
    expect(initialSource).not.toContain(h1Id);

    // 2. Perform Edit in WYSIWYG
    // Click and type to trigger update
    await wysiwyg.locator("h1").click();
    await page.keyboard.type(" Updated");

    // Wait for sync
    await expect(codeEditor).toContainText("りんごの選び方 Updated");

    // 3. Verify Source Purity
    const updatedSource = await codeEditor.textContent();
    console.log("Updated Source:", updatedSource);

    // The critical check: Source should remain clean
    expect(updatedSource).not.toContain("data-model-id");
    
    // Ensure the ID itself didn't leak (e.g. as a random attribute value)
    if (h1Id) {
        expect(updatedSource).not.toContain(h1Id);
    }
  });
});
