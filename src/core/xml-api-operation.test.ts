import { XMLAPI } from "./xml-api";
import { AST } from "./ast/xml-ast";

describe("XMLAPI Operations", () => {
  it("should set attribute on existing element", () => {
    const xml = '<root><child id="1">Text</child></root>';
    const api = new XMLAPI(xml);
    const root = api.ast!;
    const child = root.find("child")[0];

    api.setAttribute(child, "id", "2");

    expect(api.input).toBe('<root><child id="2">Text</child></root>');
    expect(child.attr("id")).toBe("2");
  });

  it("should add new attribute to element", () => {
    const xml = '<root><item /></root>';
    const api = new XMLAPI(xml);
    const item = api.ast!.find("item")[0];

    api.setAttribute(item, "new", "value");

    expect(api.input).toContain('new="value"');
    expect(item.attr("new")).toBe("value");
  });
});
