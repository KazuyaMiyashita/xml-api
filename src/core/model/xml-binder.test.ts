import { grammar } from "../cst/xml-grammar";
import { Parser } from "../cst/parser";
import { convert } from "./xml-binder";
import { AST } from "../ast/xml-ast";
import { CST } from "../cst/xml-cst";

describe("XML Converter", () => {
  const parser = new Parser(grammar);

  it("should convert simple element", () => {
    const xml = "<root>text</root>";
    const cst = parser.parse(xml, "element");
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
    const xml = '<item id="1" type="test" />';
    const cst = parser.parse(xml, "element");
    expect(cst).not.toBeNull();
    if (cst) {
      const ast = convert(cst, xml);
      expect(ast).toBeInstanceOf(AST);
      if (ast instanceof AST) {
        expect(ast.tagName).toBe("item");
        expect(ast.attr("id")).toBe("1");
        expect(ast.attr("type")).toBe("test");
      }
    }
  });

  it("should handle nested elements", () => {
    const xml = "<parent><child>1</child><child>2</child></parent>";
    const cst = parser.parse(xml, "element");
    expect(cst).not.toBeNull();
    if (cst) {
      const ast = convert(cst, xml);
      expect(ast).toBeInstanceOf(AST);
      if (ast instanceof AST) {
        expect(ast.tagName).toBe("parent");
        expect(ast.children.length).toBe(2);
        expect(ast.find("child").length).toBe(2);
      }
    }
  });

  it("should handle CDATA", () => {
    const xml = "<data><![CDATA[<raw>]]></data>";
    const cst = parser.parse(xml, "element");
    expect(cst).not.toBeNull();
    if (cst) {
      const ast = convert(cst, xml);
      expect(ast).toBeInstanceOf(AST);
      if (ast instanceof AST) {
        expect(ast.text()).toBe("<raw>");
      }
    }
  });

  it("should resolve character references", () => {
    const xml = "<char>&#65;&#x42;</char>";
    const cst = parser.parse(xml, "element");
    expect(cst).not.toBeNull();
    if (cst) {
      const ast = convert(cst, xml);
      expect(ast).toBeInstanceOf(AST);
      if (ast instanceof AST) {
        expect(ast.text()).toBe("AB");
      }
    }
  });

  describe("Character Reference Decoding (Edge Cases)", () => {
    it("should handle large decimal references", () => {
      // &#128512; -> 😀
      const xml = "<r>&#128512;</r>";
      // Parse using standard parser to ensure grammar supports it
      const cst = parser.parse(xml, "element");
      expect(cst).not.toBeNull();
      if (cst) {
        const ast = convert(cst, xml);
        if (ast instanceof AST) {
          expect(ast.text()).toBe("😀");
        }
      }
    });

    it("should handle large hexadecimal references", () => {
      // &#x1F600; -> 😀
      const xml = "<r>&#x1F600;</r>";
      const cst = parser.parse(xml, "element");
      expect(cst).not.toBeNull();
      if (cst) {
        const ast = convert(cst, xml);
        if (ast instanceof AST) {
          expect(ast.text()).toBe("😀");
        }
      }
    });

    it("should throw RangeError for invalid code points (manual CST)", () => {
      // Simulate a parser that allowed an invalid number through (or checking converter robustness)
      const invalidRef = "&#999999999;"; // Way out of unicode range
      // Manually construct a CST node that looks like a Reference
      const node = new CST("sequence", "Reference", 0, invalidRef.length, [
        new CST("literal", undefined, 0, invalidRef.length),
      ]);

      expect(() => convert(node, invalidRef)).toThrow(RangeError);
    });
  });
});
