import type { ModelElement } from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";

describe("XMLBinder Reconciliation ID Persistence", () => {
  it("should preserve node ID when attribute is updated", () => {
    const xml = '<root><item id="1">Text</item></root>';
    const api = new XMLAPI(xml);
    const initialModel = api.model!;
    const item = initialModel.find("item")[0];
    const originalId = item.id;

    // Update attribute: id="1" -> id="2"
    const target = 'id="1"';
    const start = xml.indexOf(target);

    // Replace entire attribute assignment
    api.updateSource(start, start + target.length, 'id="2"');

    const newModel = api.model!;
    const newItem = newModel.find("item")[0];

    expect(newItem.attributes.get("id")).toBe("2");
    expect(newItem.id).toBe(originalId); // ID must be preserved
  });

  it("should preserve node ID when text content is updated", () => {
    const xml = "<root><item>Original</item></root>";
    const api = new XMLAPI(xml);
    const initialModel = api.model!;
    const item = initialModel.find("item")[0];
    const originalId = item.id;

    const start = xml.indexOf("Original");
    api.updateSource(start, start + "Original".length, "Updated");

    const newModel = api.model!;
    const newItem = newModel.find("item")[0];

    expect(newItem.text()).toBe("Updated");
    expect(newItem.id).toBe(originalId);
  });

  it("should preserve node ID for siblings when one is modified", () => {
    const xml = '<root><a id="1"/><b id="2"/></root>';
    const api = new XMLAPI(xml);
    const root = api.model!;
    const a = root.children[0] as ModelElement;
    const b = root.children[1] as ModelElement;
    const idA = a.id;
    const idB = b.id;

    // Modify 'a'
    const target = 'id="1"';
    const start = xml.indexOf(target);
    api.updateSource(start, start + target.length, 'id="3"');

    const newRoot = api.model!;
    const newA = newRoot.children[0] as ModelElement;
    const newB = newRoot.children[1] as ModelElement;

    expect(newA.attributes.get("id")).toBe("3");
    expect(newA.id).toBe(idA); // Modified node preserved
    expect(newB.id).toBe(idB); // Sibling preserved
  });
});
