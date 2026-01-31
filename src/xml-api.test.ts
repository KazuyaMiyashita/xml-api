import { XMLAPI } from "./xml-api";
import { AST } from "./xml-ast";
import { grammar as minGrammar } from "./minimum-grammar";
import { convert as minConvert } from "./minimum-converter";
import { GrammarBuilder, ref, opt, seq, lit, plus, reg } from "./grammar";
import { CST } from "./xml-cst";

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
    // Helper to verify that update_input results match a fresh parse
    function assertCSTEquals(actual: CST | null, expected: CST | null) {
      if (actual === null || expected === null) {
        expect(actual).toBe(expected);
        return;
      }

      expect(actual.type).toBe(expected.type);
      expect(actual.name).toBe(expected.name);
      expect(actual.start).toBe(expected.start);
      expect(actual.end).toBe(expected.end);
      expect(actual.wellFormed).toBe(expected.wellFormed);
      expect(actual.children).toHaveLength(expected.children.length);

      for (let i = 0; i < actual.children.length; i++) {
        const actualChild = actual.children[i];
        const expectedChild = expected.children[i];

        // Check parent reference consistency
        expect(actualChild.parent).toBe(actual);
        
        assertCSTEquals(actualChild, expectedChild);
      }
    }

    function verifyUpdate(api: XMLAPI, from: number, to: number, value: string) {
      const originalInput = api.input;
      const expectedInput =
        originalInput.slice(0, from) + value + originalInput.slice(to);

      api.update_input(from, to, value);

      const freshApi = new XMLAPI(expectedInput, api.grammar, api.converter);

      expect(api.input).toBe(expectedInput);
      assertCSTEquals(api.cst, freshApi.cst);
      expect(api.ast).toEqual(freshApi.ast);
    }

    it("should be consistent with full re-parse after updating text", () => {
      const initialXml = "<root><child>hello</child></root>";
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      expect(api.ast).toBeDefined();
      if (api.ast) {
        expect(api.ast.tagName).toBe("root");
        expect(api.ast.children[0]).toMatchObject({ tagName: "child" });
      }

      // Update "hello" to "world" (pos 13-18)
      verifyUpdate(api, 13, 18, "world");

      const expectedXml = "<root><child>world</child></root>";
      expect(api.input).toBe(expectedXml);
      // verifyUpdate already checked consistency
    });

    it("should handle tag name changes", () => {
      const initialXml = "<foo></foo>";
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      // Change <foo> to <bar>
      verifyUpdate(api, 1, 4, "bar"); // <bar></foo> -> invalid
      expect(api.cst?.wellFormed).toBe(false);

      // Change </foo> to </bar>
      verifyUpdate(api, 7, 10, "bar"); // <bar></bar> -> valid
      expect(api.cst?.wellFormed).toBe(true);
      if (api.ast) {
        expect(api.ast.tagName).toBe("bar");
      }
    });

    it("should handle attribute updates", () => {
      const initialXml = '<root attr="val" />';
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      // Change "val" to "newval"
      verifyUpdate(api, 12, 15, "newval");

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
      verifyUpdate(api, 8, 8, ' foo="bar"');

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
      verifyUpdate(api, 7, 11, "ite");
      // Input: <root><ite>A</item></root>

      expect(api.cst).not.toBeNull();
      // Valid structure (parseable), but semantic validation (tag match) fails.
      expect(api.cst?.wellFormed).toBe(false);

      // AST might be null if wellFormed is false
      expect(api.ast).toBeNull();
    });

    it("should handle insertion at the very beginning (Prepend Invalid)", () => {
      // Initial: <root></root>
      const initialXml = "<root></root>";
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      // Insert "   " at 0.
      // minGrammar 'document' -> 'element' -> STag content ETag.
      // Does not allow leading whitespace.
      // So this invalidates the XML.
      verifyUpdate(api, 0, 0, "   ");
      expect(api.input).toBe("   <root></root>");

      // Should be null because it's invalid
      expect(api.cst).toBeNull();
    });

    it("should handle insertion at the very end (Append Invalid)", () => {
      const initialXml = "<root></root>";
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      verifyUpdate(api, 13, 13, "   "); // 13 is length of <root></root>
      expect(api.input).toBe("<root></root>   ");

      // Should be null because it's invalid
      expect(api.cst).toBeNull();
    });

    it("should handle valid prepend with lenient grammar", () => {
      // Define a grammar that allows spaces at root
      const g = new GrammarBuilder();
      g.rule("S", plus(reg("[ \t\r\n]")));
      g.rule("root", seq(lit("<root>"), lit("</root>")));
      // document allows optional S, root, optional S
      g.rule("document", seq(opt(ref("S")), ref("root"), opt(ref("S"))));
      const lenientGrammar = g.build("document");

      // Custom converter to handle the extra wrapping
      const lenientConvert = (node: CST, input: string) => {
        if (node.name === "document") {
          // document -> seq(opt S, root, opt S)
          // We want the middle child 'root'
          // node.children[0] is opt S
          // node.children[1] is root (Reference)
          // root -> seq(<root>, </root>)
          // Let's just return a dummy AST for this test, as we only care about CST update.
          return new AST("root", {});
        }
        return minConvert(node, input);
      };

      const api = new XMLAPI("<root></root>", lenientGrammar, lenientConvert);
      expect(api.cst).not.toBeNull();

      // Prepend space
      verifyUpdate(api, 0, 0, "   ");
      expect(api.input).toBe("   <root></root>");

      // Should remain valid and CST should cover it
      expect(api.cst).not.toBeNull();
      expect(api.cst?.start).toBe(0);
      expect(api.cst?.end).toBe(16);
    });

    it("should handle wrapping the root element", () => {
      const initialXml = "<root>A</root>"; // length 14
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      // 1. Insert "<wrap>" at 0.
      verifyUpdate(api, 0, 0, "<wrap>");
      // Invalid
      expect(api.cst).toBeNull();

      // 2. Insert "</wrap>" at end.
      // Input length was 14+6=20.
      verifyUpdate(api, 20, 20, "</wrap>");

      expect(api.input).toBe("<wrap><root>A</root></wrap>");

      // Now it should be valid again.
      expect(api.cst).not.toBeNull();
      expect(api.cst?.wellFormed).toBe(true);
      expect(api.ast?.tagName).toBe("wrap");
      expect(api.ast?.children[0]).toMatchObject({ tagName: "root" });
    });

    it("should handle deleting the entire content and replacing it", () => {
      const initialXml = "<root>Old</root>";
      const api = new XMLAPI(initialXml, minGrammar, minConvert);

      const newXml = "<new>New</new>";
      verifyUpdate(api, 0, initialXml.length, newXml);

      expect(api.input).toBe(newXml);
      expect(api.ast?.tagName).toBe("new");
      expect(api.ast?.text()).toBe("New");
    });
  });
});
