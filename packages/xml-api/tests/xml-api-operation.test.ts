import { ModelElement, ModelText, ModelNode } from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";

function h(
  tagName: string,
  attrs: { [key: string]: string } = {},
  children: (ModelNode | string)[] = [],
): ModelElement {
  const el = new ModelElement(tagName);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === "string") {
      el.addChild(new ModelText(child));
    } else {
      el.addChild(child);
    }
  }
  return el;
}

describe("XMLAPI Operations", () => {
  it("should set attribute on existing element", () => {
    const xml = '<root><child id="1">Text</child></root>';
    const api = new XMLAPI(xml);
    const root = api.model!;
    const child = root.find("child")[0];

    api.setAttribute(child, "id", "2");

    expect(api.input).toBe('<root><child id="2">Text</child></root>');
    expect(child.attributes.get("id")).toBe("2");
  });

  it("should add new attribute to element", () => {
    const xml = "<root><item /></root>";
    const api = new XMLAPI(xml);
    const item = api.model!.find("item")[0]!;

    api.setAttribute(item, "new", "value");

    expect(api.input).toContain('new="value"');
    expect(item.attributes.get("new")).toBe("value");
  });

  it("should update text content of element", () => {
    const xml = "<root><title>Old</title></root>";
    const api = new XMLAPI(xml);
    const title = api.model!.find("title")[0]!;

    api.updateText(title, "New Title");

    expect(api.input).toBe("<root><title>New Title</title></root>");
    expect(title.text()).toBe("New Title");
  });

  it("should replace entire node", () => {
    const xml = "<root><old>content</old></root>";
    const api = new XMLAPI(xml);
    const oldNode = api.model!.find("old")[0]!;

    const newNode = h("new", {}, ["replaced"]);
    api.replaceNode(oldNode, newNode);

    expect(api.input).toBe("<root><new>replaced</new></root>");
    expect(api.model!.find("new")[0].text()).toBe("replaced");
  });
});
