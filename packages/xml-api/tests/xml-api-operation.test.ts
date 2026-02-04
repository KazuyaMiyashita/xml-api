import { XMLAPI } from "@/xml-api";

describe("XMLAPI Operations", () => {
  it("should set attribute on existing element", () => {
    const xml = '<root><child id="1">Text</child></root>';
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    const child = doc.querySelector("child")!;

    child.setAttribute("id", "2");

    expect(api.source).toBe('<root><child id="2">Text</child></root>');
    expect(child.getAttribute("id")).toBe("2");
  });

  it("should add new attribute to element", () => {
    const xml = "<root><item /></root>";
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    const item = doc.querySelector("item")!;

    item.setAttribute("new", "value");

    expect(api.source).toContain('new="value"');
    expect(item.getAttribute("new")).toBe("value");
  });

  it("should update text content of element", () => {
    const xml = "<root><title>Old</title></root>";
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    const title = doc.querySelector("title")!;

    title.textContent = "New Title";

    expect(api.source).toBe("<root><title>New Title</title></root>");
    expect(title.textContent).toBe("New Title");
  });

  it("should replace entire node", () => {
    const xml = "<root><old>content</old></root>";
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    const oldNode = doc.querySelector("old")!;
    const parent = oldNode.parentNode!;

    const newNode = doc.createElement("new");
    newNode.textContent = "replaced";

    parent.replaceChild(newNode, oldNode);

    expect(api.source).toBe("<root><new>replaced</new></root>");
    const newElement = doc.querySelector("new");
    expect(newElement?.textContent).toBe("replaced");
  });
});
