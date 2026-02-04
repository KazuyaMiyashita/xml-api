import { XMLAPI } from "../../src/xml-api";
import { ExternalNode } from "../../src/view/view-binder";

function createExternalElement(
  name: string,
  children: ExternalNode[] = [],
): ExternalNode {
  return {
    nodeType: 1,
    nodeName: name,
    textContent: null,
    childNodes: children,
    attributes: [],
  };
}

function createExternalText(text: string): ExternalNode {
  return {
    nodeType: 3,
    nodeName: "#text",
    textContent: text,
    childNodes: [],
    attributes: [],
  };
}

describe("SchemaView Reconciliation", () => {
  test("updates source through reconcile", () => {
    const source = `<root>
  <p>Original</p>
</root>`;
    const api = new XMLAPI(source);
    const view = api.createView();

    const external = createExternalElement("root", [
      createExternalElement("p", [createExternalText("Updated")]),
    ]);

    view.reconcile(external);

    expect(api.source).toBe(`<root>
  <p>Updated</p>
</root>`);
  });

  test("preserves invisible nodes", () => {
    const source = `<root>
  <!-- Comment -->
  <p>Text</p>
</root>`;
    const api = new XMLAPI(source);
    const view = api.createView({
      filter: (node) => node.getType() !== "Comment",
    });

    const external = createExternalElement("root", [
      createExternalElement("p", [createExternalText("Text")]),
    ]);

    view.reconcile(external);

    expect(api.source).toBe(source);

    const externalMod = createExternalElement("root", [
      createExternalElement("p", [createExternalText("New Text")]),
    ]);

    view.reconcile(externalMod);

    expect(api.source).toContain("<!-- Comment -->");
    expect(api.source).toContain("<p>New Text</p>");
  });
});
