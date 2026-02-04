import { XMLAPI } from "@/xml-api";

describe("XMLAPI DOM Structure Sync", () => {
  it("should sync appendChild to source", () => {
    const xml = "<root><a/></root>";
    const api = new XMLAPI(xml);
    const doc = api.getDocument();

    const newChild = doc.createElement("b");
    doc.documentElement?.appendChild(newChild);

    expect(api.source).toContain("<root><a/><b /></root>");
  });

  it("should sync insertBefore to source", () => {
    const xml = "<root><c/></root>";
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    if (!doc.documentElement) throw new Error("Document element is null");
    const root = doc.documentElement;

    if (!root.firstChild) throw new Error("First child is null");
    const refNode = root.firstChild;
    const newChild = doc.createElement("a");

    root.insertBefore(newChild, refNode);

    expect(api.source).toContain("<root><a /><c/></root>");
  });

  it("should sync removeChild to source", () => {
    const xml = "<root><a/><b/></root>";
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    if (!doc.documentElement) throw new Error("Document element is null");
    const root = doc.documentElement;

    if (!root.firstChild) throw new Error("First child is null");
    const childToRemove = root.firstChild;
    root.removeChild(childToRemove);

    expect(api.source).toBe("<root><b/></root>");
  });

  it("should handle text node insertion", () => {
    const xml = "<p>World</p>";
    const api = new XMLAPI(xml);
    const doc = api.getDocument();
    if (!doc.documentElement) throw new Error("Document element is null");
    const p = doc.documentElement;

    const newText = doc.createTextNode("Hello ");
    p.insertBefore(newText, p.firstChild);

    expect(api.source).toBe("<p>Hello World</p>");
  });
});
