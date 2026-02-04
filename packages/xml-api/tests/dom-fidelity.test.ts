import {
  CharacterData,
  createWrapper,
  type DOMObserver,
  Document,
  type Element,
  Node,
} from "@/dom";
import { ModelElement, ModelText } from "@/model/xml-api-model";
import type { XMLBinder } from "@/model/xml-binder";
import { XMLAPI } from "@/xml-api";

describe("DOM Fidelity Verification", () => {
  const xmlInput = `<root>
  <child id="1">Text</child>
  <!-- Comment -->
  <child id="2"  class="foo" >More Text</child>
</root>`;

  it("should preserve formatting when modifying attributes via DOM", () => {
    const api = new XMLAPI(xmlInput);
    const doc = new Document();

    // We need to access the internal binder to calculate patches
    // In a real app, this logic would be inside XMLAPI or a Bridge
    const binder = (api as any).engine.binder as XMLBinder;

    const observer: DOMObserver = {
      onAttributeChange: (element, name, value) => {
        const model = element.getModel();
        if (model instanceof ModelElement && value !== null) {
          const patch = binder.calcSetAttributePatch(model, name, value);
          if (patch) {
            api.updateSource(patch.start, patch.end, patch.text);
          }
        }
      },
      onTextChange: (node, text) => {
        const model = node.getModel();
        if (model instanceof ModelElement) {
          // Not supported directly on element in binder yet?
          // Binder has calcUpdateTextPatch which takes ModelElement and new Text
          // But here node is CharacterData... wait.
          // If node is Text, its parent is Element.
        } else if (model instanceof ModelText && model.parent) {
          const patch = binder.calcUpdateTextPatch(model.parent, text);
          if (patch) {
            api.updateSource(patch.start, patch.end, patch.text);
          }
        }
      },
      onElementTextChange: () => {},
      onChildAdded: () => {},
      onChildRemoved: () => {},
      onChildReplaced: () => {},
    };

    doc.setObserver(observer);

    // Bootstrap DOM
    if (api.model) {
      doc.documentElement = createWrapper(api.model, doc) as Element;
    }

    // Modify via DOM
    const child2 = doc.querySelector("#2");
    expect(child2).not.toBeNull();

    child2!.setAttribute("class", "bar");

    // Check Source Fidelity
    // Expect: <child id="2"  class="bar" >
    // Spaces should be preserved.
    expect(api.source).toContain('<child id="2"  class="bar" >');
    expect(api.source).toContain('<child id="1">Text</child>'); // Unchanged
  });

  it("should preserve formatting when updating text via DOM", () => {
    const api = new XMLAPI(xmlInput);
    const doc = new Document();
    const binder = (api as any).engine.binder as XMLBinder;

    const observer: DOMObserver = {
      onAttributeChange: () => {},
      onTextChange: (node, text) => {
        const model = node.getModel();
        if (model instanceof ModelText && model.parent) {
          const patch = binder.calcUpdateTextPatch(model.parent, text);
          if (patch) {
            api.updateSource(patch.start, patch.end, patch.text);
          }
        }
      },
      onElementTextChange: () => {},
      onChildAdded: () => {},
      onChildRemoved: () => {},
      onChildReplaced: () => {},
    };

    doc.setObserver(observer);
    if (api.model) {
      doc.documentElement = createWrapper(api.model, doc) as Element;
    }

    const child1 = doc.querySelector("#1");
    // child1 is Element. We need to get its text node.
    // DOM wrapper implementation: firstChild
    const textNode = child1?.firstChild as any; // Text
    textNode.data = "Updated";

    expect(api.source).toContain('<child id="1">Updated</child>');
    expect(api.source).toContain('  <child id="1">'); // Indent preserved
  });
});
