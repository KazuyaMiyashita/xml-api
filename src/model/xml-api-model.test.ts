import { ModelElement, ModelText } from "./xml-api-model";

describe("XMLAPIModel", () => {
  it("should build a tree structure", () => {
    const root = new ModelElement("root");
    const child = new ModelElement("child");
    const text = new ModelText("content");

    root.addChild(child);
    child.addChild(text);

    expect(root.children).toHaveLength(1);
    expect(root.children[0]).toBe(child);
    expect(child.parent).toBe(root);

    expect(child.children).toHaveLength(1);
    expect(child.children[0]).toBe(text);
    expect(text.parent).toBe(child);
  });

  it("should assign unique IDs", () => {
    const node1 = new ModelElement("a");
    const node2 = new ModelElement("b");
    expect(node1.id).not.toBe(node2.id);
  });

  it("should manage attributes", () => {
    const el = new ModelElement("item");
    el.setAttribute("id", "123");
    expect(el.attributes.get("id")).toBe("123");
  });
});
