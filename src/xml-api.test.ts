import { XMLAPI } from "./xml-api";
import { AST } from "./xml-ast";
import { grammar as minGrammar } from "./minimum-grammar";
import { convert as minConvert } from "./minimum-converter";

describe("XMLAPI", () => {
  describe("Default Configuration (Standard XML)", () => {
    it("should parse and convert automatically in constructor", () => {
      const xml = '<root id="1">Text</root>';
      const api = new XMLAPI(xml);

      expect(api.cst).not.toBeNull();
      expect(api.ast).toBeInstanceOf(AST);
      if (api.ast instanceof AST) {
        expect(api.ast.tagName).toBe("root");
        expect(api.ast.attr("id")).toBe("1");
        expect(api.ast.text()).toBe("Text");
      }
    });

    it("should have null ast if xml is not well-formed (mismatched tags)", () => {
      const xml = "<root>text</foo>";
      const api = new XMLAPI(xml);

      expect(api.cst).not.toBeNull();
      // In the new parser implementation, mismatched tags in a choice (like element) might
      // result in a failed parse for that branch, or if forced, a non-well-formed node.
      // With the current grammar, element -> STag content ETag requires names to match via validator.
      // The validator sets wellFormed = false.
      expect(api.cst?.wellFormed).toBe(false);
      expect(api.ast).toBeNull();
    });

    it("should have null cst if parsing fails completely", () => {
      const xml = "not xml at all";
      const api = new XMLAPI(xml);

      expect(api.cst).toBeNull();
      expect(api.ast).toBeNull();
    });
  });

  describe("Custom Configuration (Minimum Grammar)", () => {
    it("should accept custom grammar and converter", () => {
      const xml = "<min>Simple</min>";
      const api = new XMLAPI(xml, minGrammar, minConvert);

      expect(api.ast).toBeInstanceOf(AST);
      if (api.ast instanceof AST) {
        expect(api.ast.tagName).toBe("min");
        expect(api.ast.text()).toBe("Simple");
      }
    });
  });

  describe("XMLAPI.update_input", () => {
    it("should be consistent with full re-parse after updating text", () => {
      const initialXml = "<root><child>hello</child></root>";
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      expect(api.ast).toBeDefined();
      if (api.ast) {
        expect(api.ast.tagName).toBe("root");
        expect(api.ast.children[0]).toMatchObject({ tagName: "child" });
      }

      // Update "hello" to "world" (pos 13-18)
      api.update_input(13, 18, "world");

      const expectedXml = "<root><child>world</child></root>";
      expect(api.input).toBe(expectedXml);

      const freshApi = new XMLAPI(expectedXml, minGrammar, minConvert);
      expect(api.cst).toEqual(freshApi.cst);
      expect(api.ast).toEqual(freshApi.ast);
    });

    it("should handle tag name changes", () => {
      const initialXml = "<foo></foo>";
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      // Change <foo> to <bar>
      api.update_input(1, 4, "bar"); // <bar></foo> -> invalid
      expect(api.cst?.wellFormed).toBe(false);

      // Change </foo> to </bar>
      api.update_input(7, 10, "bar"); // <bar></bar> -> valid
      expect(api.cst?.wellFormed).toBe(true);
      if (api.ast) {
        expect(api.ast.tagName).toBe("bar");
      }
    });

    it("should handle attribute updates", () => {
      const initialXml = '<root attr="val" />';
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      // Change "val" to "newval"
      api.update_input(12, 15, "newval");

      if (api.ast) {
        expect(api.ast.attributes["attr"]).toBe("newval");
      }
    });

    it("should handle structural changes (length change)", () => {
      const initialXml = "<root><a>text</a></root>";
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      // Change <a>text</a> to <a foo="bar">text</a>
      // This increases the length of STag, and thus the length of 'a' element.
      // The incremental update should realize STag length changed, try to update STag,
      // see it doesn't match expected end, and go up to 'element' (or 'content' parent).
      // <root> is 6 chars. <a> starts at 6. < a >. < is 6, a is 7, > is 8.
      // We want to insert ' foo="bar"' after 'a' (7) and before '>' (8).
      api.update_input(8, 8, ' foo="bar"');

      const expected = '<root><a foo="bar">text</a></root>';
      expect(api.input).toBe(expected);
      expect(api.cst).not.toBeNull();
      expect(api.cst?.wellFormed).toBe(true);

      // Check AST
      if (api.ast) {
        // root -> children[0] (a) -> attributes
        const aNode = api.ast.children[0];
        if (typeof aNode !== "string") {
          expect(aNode.attributes["foo"]).toBe("bar");
        } else {
          fail("Expected AST node");
        }
      }
    });

    it("should maintain CST even if wellFormed becomes false", () => {
      const initialXml = "<root><item>A</item></root>";
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      // Break the closing tag: </item> -> </ite>
      // This makes the element invalid (tag mismatch or parse error for ETag).
      // If ETag fails to parse, the 'element' rule might fail to match completely if it requires ETag.
      // In minimum-grammar, element = STag content ETag.
      // If ETag is broken, 'element' fails.
      // The update loop will go up to 'content' (of root) -> 'element' (root).
      // Root re-parse might fail if the structure is totally invalid?
      // Actually, if 'element' fails, 'document' might fail if it strictly requires 'element'.

      // Let's try a milder invalidation: Tag Mismatch.
      // <item> -> <ite>
      api.update_input(7, 11, "ite");
      // Input: <root><ite>A</item></root>

      expect(api.cst).not.toBeNull();
      // Valid structure (parseable), but semantic validation (tag match) fails.
      expect(api.cst?.wellFormed).toBe(false);

      // AST might be null if wellFormed is false
      expect(api.ast).toBeNull();
    });
  });
});
