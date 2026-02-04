import { Document, Element } from "@/dom";
import { XMLAPI } from "@/xml-api";

describe("XMLAPI DOM Integration", () => {
  test("getDocument returns a linked Document object", () => {
    const xml = `<root><item>test</item></root>`;
    const api = new XMLAPI(xml);
    const doc = api.getDocument();

    expect(doc).toBeInstanceOf(Document);
    expect(doc.documentElement).toBeInstanceOf(Element);
    expect(doc.documentElement?.tagName).toBe("root");
  });

  test("DOM changes reflect in source code (setAttribute)", () => {
    const xml = `<root>
  <item id="1">Original</item>
</root>`;
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    const item = doc.querySelector("item");

    expect(item).not.toBeNull();
    if (item) {
      item.setAttribute("status", "active");
    }

    // Check if source code is updated
    // Expected: <item id="1" status="active">
    expect(api.source).toContain('status="active"');
    expect(api.source).toContain(
      '<item id="1" status="active">Original</item>',
    );
  });

  test("DOM changes reflect in source code (textContent)", () => {
    const xml = `<root>
  <item>Original</item>
</root>`;
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    const item = doc.querySelector("item");

    expect(item).not.toBeNull();
    if (item) {
      item.textContent = "Updated Value";
    }

    // Check if source code is updated
    expect(api.source).toContain("Updated Value");
    // Verify full structure to ensure tags are preserved
    expect(api.source).toContain("<item>Updated Value</item>");
  });

  test("Reconciliation preserves DOM references after update", () => {
    const xml = `<root><item id="1">A</item></root>`;
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    const item = doc.querySelector("item")!;

    // First update
    item.setAttribute("foo", "bar");
    expect(api.source).toContain('foo="bar"');

    // Item reference should still work (because of Model reconciliation)
    // Update again
    item.setAttribute("baz", "qux");
    expect(api.source).toContain('baz="qux"');

    const expected = `<root><item id="1" foo="bar" baz="qux">A</item></root>`;
    // Note: Attribute order depends on implementation, regex or multiple expects might be safer
    // But binder usually appends.
    // Let's just check presence.
    expect(api.source).toContain('foo="bar"');
    expect(api.source).toContain('baz="qux"');
  });
});
