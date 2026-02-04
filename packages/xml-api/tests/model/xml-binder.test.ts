import { Parser } from "@/cst/parser";
import { CST } from "@/cst/xml-cst";
import { grammar } from "@/cst/xml-grammar";
import { ModelElement, type ModelNode } from "@/model/xml-api-model";
import { XMLBinder } from "@/model/xml-binder";

function convert(node: CST, input: string): ModelNode | null {
  const binder = new XMLBinder(input);
  return binder.hydrate(node);
}

describe("XML Binder (Hydration)", () => {
  const parser = new Parser(grammar);

  it("should convert simple element", () => {
    const xml = "<root>text</root>";
    const cst = parser.parse(xml, "element");
    expect(cst).not.toBeNull();
    if (cst) {
      const model = convert(cst, xml);
      expect(model).toBeInstanceOf(ModelElement);
      if (model instanceof ModelElement) {
        expect(model.tagName).toBe("root");
        expect(model.text()).toBe("text");
      }
    }
  });

  it("should convert attributes", () => {
    const xml = '<item id="1" type="test" />';
    const cst = parser.parse(xml, "element");
    expect(cst).not.toBeNull();
    if (cst) {
      const model = convert(cst, xml);
      expect(model).toBeInstanceOf(ModelElement);
      if (model instanceof ModelElement) {
        expect(model.tagName).toBe("item");
        expect(model.attributes.get("id")).toBe("1");
        expect(model.attributes.get("type")).toBe("test");
      }
    }
  });

  it("should handle nested elements", () => {
    const xml = "<parent><child>1</child><child>2</child></parent>";
    const cst = parser.parse(xml, "element");
    expect(cst).not.toBeNull();
    if (cst) {
      const model = convert(cst, xml);
      expect(model).toBeInstanceOf(ModelElement);
      if (model instanceof ModelElement) {
        expect(model.tagName).toBe("parent");
        expect(model.children.length).toBe(2);
        expect(model.find("child").length).toBe(2);
      }
    }
  });

  it("should handle CDATA", () => {
    const xml = "<data><![CDATA[<raw>]]></data>";
    const cst = parser.parse(xml, "element");
    expect(cst).not.toBeNull();
    if (cst) {
      const model = convert(cst, xml);
      expect(model).toBeInstanceOf(ModelElement);
      if (model instanceof ModelElement) {
        expect(model.text()).toBe("<raw>");
      }
    }
  });

  it("should resolve character references", () => {
    const xml = "<char>&#65;&#x42;</char>";
    const cst = parser.parse(xml, "element");
    expect(cst).not.toBeNull();
    if (cst) {
      const model = convert(cst, xml);
      expect(model).toBeInstanceOf(ModelElement);
      if (model instanceof ModelElement) {
        expect(model.text()).toBe("AB");
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
        const model = convert(cst, xml);
        if (model instanceof ModelElement) {
          expect(model.text()).toBe("😀");
        }
      }
    });

    it("should handle large hexadecimal references", () => {
      // &#x1F600; -> 😀
      const xml = "<r>&#x1F600;</r>";
      const cst = parser.parse(xml, "element");
      expect(cst).not.toBeNull();
      if (cst) {
        const model = convert(cst, xml);
        if (model instanceof ModelElement) {
          expect(model.text()).toBe("😀");
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
