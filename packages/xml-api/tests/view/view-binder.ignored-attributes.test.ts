import { Document, Element, Text } from "../../src/dom";
import { ViewBinder } from "../../src/view/view-binder";

describe("ViewBinder Ignored Attributes", () => {
  let doc: Document;
  let binder: ViewBinder;

  beforeEach(() => {
    doc = new Document();
    binder = new ViewBinder(doc);
  });

  it("should ignore data-model-id attribute during creation", () => {
    const divNode = {
      nodeType: 1,
      nodeName: "div",
      textContent: null,
      childNodes: [],
      attributes: [
        { name: "class", value: "foo" },
        { name: "data-model-id", value: "ignore-me" },
      ],
    };

    const externalRoot = {
      nodeType: 1,
      nodeName: "root",
      textContent: null,
      childNodes: [divNode],
    };

    const internalRoot = doc.createElement("root");
    binder.reconcile(externalRoot, internalRoot);

    const createdDiv = internalRoot.childNodes.item(0) as Element;
    expect(createdDiv.tagName).toBe("div");
    expect(createdDiv.getAttribute("class")).toBe("foo");
    expect(createdDiv.getAttribute("data-model-id")).toBeNull();
  });

  it("should ignore data-model-id attribute during update", () => {
    // Initial state
    const div = doc.createElement("div");
    div.setAttribute("class", "foo");
    const internalRoot = doc.createElement("root");
    internalRoot.appendChild(div);

    // Update with ignored attribute
    const divNode = {
      nodeType: 1,
      nodeName: "div",
      textContent: null,
      childNodes: [],
      attributes: [
        { name: "class", value: "bar" },
        { name: "data-model-id", value: "ignore-me" },
      ],
    };

    const externalRoot = {
      nodeType: 1,
      nodeName: "root",
      textContent: null,
      childNodes: [divNode],
    };

    binder.reconcile(externalRoot, internalRoot);

    expect(div.getAttribute("class")).toBe("bar");
    expect(div.getAttribute("data-model-id")).toBeNull();
  });

  it("should not remove existing data-model-id if it somehow exists (optional, but testing ignored logic)", () => {
    // If we manually add data-model-id to internal DOM, ViewBinder should just ignore it from external.
    const div = doc.createElement("div");
    div.setAttribute("data-model-id", "existing");
    const internalRoot = doc.createElement("root");
    internalRoot.appendChild(div);

    const divNode = {
      nodeType: 1,
      nodeName: "div",
      textContent: null,
      childNodes: [],
      attributes: [
        { name: "class", value: "bar" },
        { name: "data-model-id", value: "new-ignore" },
      ],
    };

    const externalRoot = {
      nodeType: 1,
      nodeName: "root",
      textContent: null,
      childNodes: [divNode],
    };

    binder.reconcile(externalRoot, internalRoot);

    // Should NOT update to "new-ignore"
    expect(div.getAttribute("data-model-id")).toBe("existing");
    expect(div.getAttribute("class")).toBe("bar");
  });
});
