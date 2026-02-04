import type { Element } from "../../src/dom";
import {
  type ModelElement,
  ModelNodeType,
} from "../../src/model/xml-api-model";
import { XMLAPI } from "../../src/xml-api";

describe("SchemaView", () => {
  const xml = `
<root>
  <visible id="v1">A</visible>
  <hidden id="h1">B</hidden>
  <visible id="v2">C</visible>
  <!-- comment -->
</root>
`;

  it("filters nodes based on config", () => {
    const api = new XMLAPI(xml);
    const view = api.createView({
      filter: (node) => {
        if (node.getType() === ModelNodeType.Element) {
          return (node as ModelElement).tagName === "visible";
        }
        // Hide text and comments for this test
        return false;
      },
    });

    const root = view.getRoot();
    // ... (rest is same)

    expect(root.tagName).toBe("root");

    const children = root.childNodes;
    expect(children.length).toBe(2);
    expect((children.item(0) as Element).tagName).toBe("visible");
    expect((children.item(1) as Element).tagName).toBe("visible");

    // ID check
    expect((children.item(0) as Element).getAttribute("id")).toBe("v1");
    expect((children.item(1) as Element).getAttribute("id")).toBe("v2");
  });

  it("nextSibling skips filtered nodes", () => {
    const api = new XMLAPI(xml);
    const view = api.createView({
      filter: (node) => {
        if (node.getType() === ModelNodeType.Element) {
          return (node as ModelElement).tagName === "visible";
        }
        return false;
      },
    });

    const root = view.getRoot();
    const v1 = root.childNodes.item(0) as Element;
    const v2 = v1.nextSibling as Element;

    expect(v2).not.toBeNull();
    expect(v2.tagName).toBe("visible");
    expect(v2.getAttribute("id")).toBe("v2");

    // v2.previousSibling should be v1
    expect(v2.previousSibling).not.toBeNull();
    expect((v2.previousSibling as Element).getAttribute("id")).toBe("v1");
  });

  it("getNodeByModelId returns null for filtered nodes", () => {
    const api = new XMLAPI(xml);
    const view = api.createView({
      filter: (node) => {
        if (node.getType() === ModelNodeType.Element) {
          return (node as ModelElement).tagName === "visible";
        }
        return false;
      },
    });

    const fullDoc = api.getDocument();
    const hiddenEl = fullDoc.querySelector('[id="h1"]');
    const hiddenModelId = hiddenEl!.getModel().id;

    const viewNode = view.getNodeByModelId(hiddenModelId);
    expect(viewNode).toBeNull();

    const visibleEl = fullDoc.querySelector('[id="v1"]');
    const visibleModelId = visibleEl!.getModel().id;
    const viewNodeVisible = view.getNodeByModelId(visibleModelId);
    expect(viewNodeVisible).not.toBeNull();
  });

  it("updates source when view is modified (Write-Back)", () => {
    const source = `<root>
  <visible>A</visible>
  <hidden>B</hidden>
</root>`;
    const api = new XMLAPI(source);
    const view = api.createView({
      filter: (node) => {
        if (node.getType() === ModelNodeType.Element) {
          return (node as ModelElement).tagName === "visible";
        }
        return false;
      },
    });

    const root = view.getRoot();
    const newEl = view.getDocument().createElement("visible");
    newEl.textContent = "New";

    root.appendChild(newEl);

    // Check source
    // Expected: <hidden>B</hidden> preserved. New node appended at end of model (after B).
    // Note: <hidden>B</hidden> is after <visible>A</visible>.
    // So new node should be after B.

    // Also check formatting. SyncEngine should detect indent "  " from previous siblings.
    // The previous sibling is <hidden>, which has indent "  ".
    // So new node should be indented "  ".

    // Fix indentation in expected string using explicit newlines
    const expected =
      "<root>\n  <visible>A</visible>\n  <hidden>B</hidden>\n  <visible>New</visible>\n</root>";

    expect(api.source).toBe(expected);
  });

  it("emits view events for visible nodes only", () => {
    const api = new XMLAPI(xml);
    const view = api.createView({
      filter: (node) => {
        if (node.getType() === ModelNodeType.Element) {
          return (node as ModelElement).tagName === "visible";
        }
        return false;
      },
    });

    const events: any[] = [];
    view.on((e) => events.push(e));

    const doc = api.getDocument();

    // 1. Modify visible node
    const v1El = doc.querySelector('[id="v1"]');
    // const v1Model = v1El!.getModel() as ModelElement;

    // Update via DOM
    v1El!.setAttribute("status", "changed");

    // SyncEngine emits event. View should re-emit.
    expect(events.length).toBeGreaterThan(0);
    const attrEvent = events.find((e) => e.type === "structure");
    expect(attrEvent).toBeDefined();
    expect((attrEvent!.target as Element).getAttribute("id")).toBe("v1");

    events.length = 0;

    // 2. Modify hidden node
    const h1El = doc.querySelector('[id="h1"]');
    // const h1Model = h1El!.getModel() as ModelElement;
    h1El!.setAttribute("status", "hidden-changed");

    // Should NOT emit view event
    expect(events.length).toBe(0);
  });

  // ...

  it("propagates transaction metadata", () => {
    const api = new XMLAPI(xml);
    const view = api.createView({
      filter: (node) => {
        if (node.getType() === ModelNodeType.Element) {
          return (node as ModelElement).tagName === "visible";
        }
        return false;
      },
    });

    const events: any[] = [];
    view.on((e) => events.push(e));

    const engine = (api as any).engine;
    // Create custom transaction
    const { Transaction } = require("../../src/engine/transaction");
    const tr = new Transaction(engine.state);
    tr.setMeta("origin", "test-origin");

    // Modify a VISIBLE node to trigger event
    // Find by Attribute ID, not Model UUID
    const doc = api.getDocument();
    const v1El = doc.querySelector('[id="v1"]');
    const v1Model = v1El!.getModel() as ModelElement;

    const start = v1Model.cst!.start + "<visible".length;
    tr.replace(start, start, " ");

    engine.dispatch(tr);

    expect(events.length).toBeGreaterThan(0);
    const evt = events[0];
    expect(evt.transaction).toBeDefined();
    expect(evt.transaction.getMeta("origin")).toBe("test-origin");
  });
});
