import { XMLAPI } from "../src/xml-api";

describe("Fidelity Tests", () => {
  const complexXml = `
<root>
  <!-- Comment -->
  <section id="1">
    <title>Section 1</title>
    <content>
      Indented text.
    </content>
  </section>

  <section id="2">
		<title>Tabs</title>
  </section>
</root>`;

  it("preserves formatting exactly during localized attribute update", () => {
    const api = new XMLAPI(complexXml);
    const doc = api.getDocument();

    // Limited selector support: use attribute selector directly
    const section1 = doc.querySelector('[id="1"]');
    expect(section1).not.toBeNull();

    // Update attribute
    section1?.setAttribute("status", "active");

    const expected = complexXml.replace(
      '<section id="1">',
      '<section id="1" status="active">',
    );

    expect(api.source).toBe(expected);
  });

  it("preserves formatting exactly during text update", () => {
    const api = new XMLAPI(complexXml);
    const doc = api.getDocument();

    const section1 = doc.querySelector('[id="1"]');
    expect(section1).not.toBeNull();
    const title = section1?.querySelector("title");
    expect(title).not.toBeNull();

    if (title) {
      title.textContent = "New Title";
    }

    const expected = complexXml.replace(
      "<title>Section 1</title>",
      "<title>New Title</title>",
    );

    expect(api.source).toBe(expected);
  });

  it("preserves comments and mixed indentation", () => {
    // Verify the structure didn't change at all on load
    const api = new XMLAPI(complexXml);
    expect(api.source).toBe(complexXml);
  });
});
