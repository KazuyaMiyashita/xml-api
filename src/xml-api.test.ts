import { XMLAPI } from "./xml-api";
import { AST } from "./xml-ast";
import { grammar as minGrammar } from "./minimum-grammar";
import { convert as minConvert } from "./minimum-converter";
import { GrammarBuilder, ref, opt, seq, lit, plus, reg } from "./grammar";
import { CST } from "./xml-cst";

describe("XMLAPI", () => {
  describe("Initialization & Basic Parsing", () => {
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
      expect(api.cst?.wellFormed).toBe(false);
      expect(api.ast).toBeNull();
    });

    it("should have null cst if parsing fails completely", () => {
      const xml = "not xml at all";
      const api = new XMLAPI(xml);

      expect(api.cst).toBeNull();
      expect(api.ast).toBeNull();
    });

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

  describe("update_input", () => {
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

    function verifyUpdate(
      api: XMLAPI,
      from: number,
      to: number,
      value: string,
    ) {
      const originalInput = api.input;
      const expectedInput =
        originalInput.slice(0, from) + value + originalInput.slice(to);

      api.update_input(from, to, value);

      const freshApi = new XMLAPI(expectedInput, api.grammar, api.converter);

      expect(api.input).toBe(expectedInput);
      assertCSTEquals(api.cst, freshApi.cst);
      expect(api.ast).toEqual(freshApi.ast);
    }

    describe("Incremental Content Updates", () => {
      it("should be consistent with full re-parse after updating text content", () => {
        const initialXml = "<root><child>hello</child></root>";
        const api = new XMLAPI(initialXml, minGrammar, minConvert);

        // Update "hello" to "world" (pos 13-18)
        verifyUpdate(api, 13, 18, "world");
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
    });

    describe("Structural Updates", () => {
      it("should handle STag length changes (attributes addition)", () => {
        const initialXml = "<root><a>text</a></root>";
        const api = new XMLAPI(initialXml, minGrammar, minConvert);

        // Change <a>text</a> to <a foo="bar">text</a>
        // Insert ' foo="bar"' after 'a' (7) and before '>' (8).
        verifyUpdate(api, 8, 8, ' foo="bar"');

        const expected = '<root><a foo="bar">text</a></root>';
        expect(api.input).toBe(expected);
        expect(api.cst?.wellFormed).toBe(true);

        if (api.ast) {
          const aNode = api.ast.children[0];
          if (typeof aNode !== "string") {
            expect(aNode.attributes["foo"]).toBe("bar");
          } else {
            fail("Expected AST node");
          }
        }
      });

      it("should handle sibling to parent-child transformation (swallowing)", () => {
        const initialXml = "<root><a/><b/></root>";
        const api = new XMLAPI(initialXml, minGrammar, minConvert);

        // Replace "<a/><b/>" (index 6 to 14) with "<a><b/></a>" (length 11)
        verifyUpdate(api, 6, 14, "<a><b/></a>");

        expect(api.input).toBe("<root><a><b/></a></root>");
        if (api.ast && api.ast.children[0] instanceof AST) {
          const a = api.ast.children[0];
          expect(a.tagName).toBe("a");
          expect(a.children[0]).toMatchObject({ tagName: "b" });
        }
      });

      it("should handle wrapping the root element", () => {
        const initialXml = "<root>A</root>";
        const api = new XMLAPI(initialXml, minGrammar, minConvert);

        // 1. Insert "<wrap>" at 0.
        verifyUpdate(api, 0, 0, "<wrap>");
        expect(api.cst).toBeNull(); // Invalid state

        // 2. Insert "</wrap>" at end.
        verifyUpdate(api, 20, 20, "</wrap>");

        expect(api.input).toBe("<wrap><root>A</root></wrap>");
        expect(api.cst).not.toBeNull();
        expect(api.cst?.wellFormed).toBe(true);
        expect(api.ast?.tagName).toBe("wrap");
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

    describe("Boundary & Edge Cases", () => {
      it("should handle valid prepend with lenient grammar (Root shift/re-parse)", () => {
        // Define a grammar that allows spaces at root
        const g = new GrammarBuilder();
        g.rule("S", plus(reg("[ \t\r\n]")));
        g.rule("root", seq(lit("<root>"), lit("</root>")));
        g.rule("document", seq(opt(ref("S")), ref("root"), opt(ref("S"))));
        const lenientGrammar = g.build("document");

        const lenientConvert = (node: CST, input: string) => {
          if (node.name === "document") {
            return new AST("root", {});
          }
          return minConvert(node, input);
        };

        const api = new XMLAPI("<root></root>", lenientGrammar, lenientConvert);
        expect(api.cst).not.toBeNull();

        // Prepend space - should trigger incremental root re-parse
        verifyUpdate(api, 0, 0, "   ");
        expect(api.input).toBe("   <root></root>");
        expect(api.cst).not.toBeNull();
        expect(api.cst?.start).toBe(0);
      });

      it("should handle insertion at the very beginning (Prepend Invalid)", () => {
        const initialXml = "<root></root>";
        const api = new XMLAPI(initialXml, minGrammar, minConvert);

        // Insert "   " at 0. (Not allowed in minGrammar)
        verifyUpdate(api, 0, 0, "   ");
        expect(api.cst).toBeNull();
      });

      it("should handle insertion at the very end (Append Invalid)", () => {
        const initialXml = "<root></root>";
        const api = new XMLAPI(initialXml, minGrammar, minConvert);

        verifyUpdate(api, 13, 13, "   ");
        expect(api.cst).toBeNull();
      });
    });

    describe("Error Handling & Validation", () => {
      it("should maintain CST but report wellFormed=false on semantic violation", () => {
        const initialXml = "<root><item>A</item></root>";
        const api = new XMLAPI(initialXml, minGrammar, minConvert);

        // Break the closing tag: </item> -> </ite> (but keep structure somewhat parseable if grammar allows or partial match)
        // Here we just change it to mismatched tag name
        verifyUpdate(api, 7, 11, "ite"); // <item>...<ite>

        expect(api.cst).not.toBeNull();
        expect(api.cst?.wellFormed).toBe(false);
        expect(api.ast).toBeNull();
      });

      it("should throw error for out-of-bounds indices", () => {
        const api = new XMLAPI("<root/>");
        expect(() => api.update_input(-1, 0, "")).toThrow();
        expect(() => api.update_input(0, 10, "")).toThrow();
        expect(() => api.update_input(5, 2, "")).toThrow();
      });
    });
  });
});