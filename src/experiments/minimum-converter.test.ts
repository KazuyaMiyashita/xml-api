import { grammar } from "./minimum-grammar";
import { Parser } from "../core/cst/parser";
import { convert } from "./minimum-converter";
import { AST } from "../core/ast/xml-ast";

describe("Minimum Converter", () => {
  const parser = new Parser(grammar);

  it("should convert simple element", () => {
    const xml = "<root>text</root>";
    const cst = parser.parse(xml, "document");
    expect(cst).not.toBeNull();
    if (cst) {
      const ast = convert(cst, xml);
      expect(ast).toBeInstanceOf(AST);
      if (ast instanceof AST) {
        expect(ast.tagName).toBe("root");
        expect(ast.text()).toBe("text");
      }
    }
  });

  it("should convert attributes", () => {
    const xml = '<item id="1" />';
    const cst = parser.parse(xml, "document");
    expect(cst).not.toBeNull();
    if (cst) {
      const ast = convert(cst, xml);
      expect(ast).toBeInstanceOf(AST);
      if (ast instanceof AST) {
        expect(ast.tagName).toBe("item");
        expect(ast.attr("id")).toBe("1");
      }
    }
  });
});
