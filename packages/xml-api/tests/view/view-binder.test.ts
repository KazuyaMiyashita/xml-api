import { ViewBinder, type ExternalNode } from "../../src/view/view-binder";
import { Document, type Element, type Text } from "../../src/dom";
import { ModelElement, ModelText } from "../../src/model/xml-api-model";

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

describe("ViewBinder", () => {
  let doc: Document;
  let binder: ViewBinder;
  let internalRoot: Element;

  beforeEach(() => {
    doc = new Document();
    internalRoot = doc.createElement("root");
    doc.documentElement = internalRoot;
    binder = new ViewBinder(doc);
  });

  test("syncs basic structure", () => {
    // Internal: <root></root>
    // External: <root><p>Hello</p></root>

    const external = createExternalElement("root", [
      createExternalElement("p", [createExternalText("Hello")]),
    ]);

    binder.reconcile(external, internalRoot);

    expect(internalRoot.childNodes.length).toBe(1);
    const p = internalRoot.childNodes.item(0) as Element;
    expect(p.tagName).toBe("p");
    expect(p.textContent).toBe("Hello");
  });

  test("preserves formatting whitespace", () => {
    // Internal: <root>\n  <p/></root>
    // External: <root><p/></root>

    // Setup internal with whitespace
    const wsNode = new ModelText("\n  ", undefined, "whitespace");
    (internalRoot.getModel() as ModelElement).addChild(wsNode);

    const pModel = new ModelElement("p");
    (internalRoot.getModel() as ModelElement).addChild(pModel);

    // Verify initial state
    expect(internalRoot.childNodes.length).toBe(2);

    // Setup external
    const external = createExternalElement("root", [
      createExternalElement("p"),
    ]);

    binder.reconcile(external, internalRoot);

    // Expect whitespace to remain
    expect(internalRoot.childNodes.length).toBe(2);
    const child0 = internalRoot.childNodes.item(0) as Text;
    expect(child0.textContent).toBe("\n  ");

    const child1 = internalRoot.childNodes.item(1) as Element;
    expect(child1.tagName).toBe("p");
  });

  test("removes non-whitespace content", () => {
    // Internal: <root>Text<p/></root>
    // External: <root><p/></root>

    const textModel = new ModelText("Text", undefined, "text");
    (internalRoot.getModel() as ModelElement).addChild(textModel);

    const pModel = new ModelElement("p");
    (internalRoot.getModel() as ModelElement).addChild(pModel);

    const external = createExternalElement("root", [
      createExternalElement("p"),
    ]);

    binder.reconcile(external, internalRoot);

    expect(internalRoot.childNodes.length).toBe(1);
    expect((internalRoot.childNodes.item(0) as Element).tagName).toBe("p");
  });
});
