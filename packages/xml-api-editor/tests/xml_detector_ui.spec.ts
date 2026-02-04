import { expect, test } from "@playwright/test";

test.describe("Document Type Detection UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Displays detected document type (XHTML)", async ({ page }) => {
    const header = page.locator("header.app-header h1");
    await expect(header).toContainText("Type: XHTML");
  });

  test("Detects MEI type", async ({ page }) => {
    const codeEditor = page.locator(".cm-content");
    const header = page.locator("header.app-header h1");

    const meiXml = `<?xml version="1.0" encoding="UTF-8"?>
<mei xmlns="http://www.music-encoding.org/ns/mei">
  <meiHead>
    <fileDesc>
      <titleStmt>
        <title>MEI Test</title>
      </titleStmt>
    </fileDesc>
  </meiHead>
  <music>
    <body>
    </body>
  </music>
</mei>`;

    await codeEditor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Delete");
    await page.keyboard.insertText(meiXml);

    await expect(header).toContainText("Type: MEI", { timeout: 5000 });
  });
});
