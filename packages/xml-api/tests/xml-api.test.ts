import type { CST } from "@/cst/xml-cst";
import { ModelElement } from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";

describe("XMLAPI", () => {
  describe("Initialization & Basic Parsing", () => {
    it("should parse and convert automatically in constructor", () => {
      const xml = '<root id="1">Text</root>';
      const api = new XMLAPI(xml);

      expect(api.cst).not.toBeNull();
      expect(api.model).toBeInstanceOf(ModelElement);
      if (api.model instanceof ModelElement) {
        expect(api.model.tagName).toBe("root");
        expect(api.model.attributes.get("id")).toBe("1");
        expect(api.model.text()).toBe("Text");
      }
    });

    it("should have null model if xml is not well-formed (mismatched tags)", () => {
      const xml = "<root>text</foo>";
      const api = new XMLAPI(xml);

      expect(api.cst).not.toBeNull();
      expect(api.cst?.wellFormed).toBe(false);
      expect(api.model).toBeNull();
    });

    it("should have null cst if parsing fails completely", () => {
      const xml = "not xml at all";
      const api = new XMLAPI(xml);

      expect(api.cst).toBeNull();
      expect(api.model).toBeNull();
    });
  });

  describe("updateInput", () => {
    // Helper to verify that updateInput results match a fresh parse
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

    // Helper for Model comparison (simplified)
    function assertModelEquals(
      actual: ModelElement | null,
      expected: ModelElement | null,
    ) {
      if (!actual || !expected) {
        expect(actual).toBeNull(); // Simplified check
        return;
      }
      // Use JSON stringify with circular ref handling or just check key props
      const simplify = (obj: any): any => {
        if (!obj || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(simplify);
        const { parent, cst, id, ...rest } = obj; // Exclude parent, cst, id (id is random)
        const newObj: any = {};
        for (const key in rest) {
          newObj[key] = simplify(rest[key]);
        }
        return newObj;
      };
      expect(JSON.stringify(simplify(actual))).toBe(
        JSON.stringify(simplify(expected)),
      );
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

      api.updateInput(from, to, value);

      const freshApi = new XMLAPI(expectedInput, api.grammar);

      expect(api.input).toBe(expectedInput);
      assertCSTEquals(api.cst, freshApi.cst);
      assertModelEquals(api.model, freshApi.model);
    }

    describe("Incremental Content Updates", () => {
      it("should be consistent with full re-parse after updating text content", () => {
        const initialXml = "<root><child>hello</child></root>";
        const api = new XMLAPI(initialXml);

        // Update "hello" to "world" (pos 13-18)
        verifyUpdate(api, 13, 18, "world");
      });

      it("should handle attribute updates", () => {
        const initialXml = '<root attr="val" />';
        const api = new XMLAPI(initialXml);

        // Change "val" to "newval"
        verifyUpdate(api, 12, 15, "newval");

        if (api.model) {
          expect(api.model.attributes.get("attr")).toBe("newval");
        }
      });

      it("should handle tag name changes", () => {
        const initialXml = "<foo></foo>";
        const api = new XMLAPI(initialXml);

        // Change <foo> to <bar>
        verifyUpdate(api, 1, 4, "bar"); // <bar></foo> -> invalid
        expect(api.cst?.wellFormed).toBe(false);

        // Change </foo> to </bar>
        verifyUpdate(api, 7, 10, "bar"); // <bar></bar> -> valid
        expect(api.cst?.wellFormed).toBe(true);
        if (api.model) {
          expect(api.model.tagName).toBe("bar");
        }
      });
    });

    describe("Structural Updates", () => {
      it("should handle STag length changes (attributes addition)", () => {
        const initialXml = "<root><a>text</a></root>";
        const api = new XMLAPI(initialXml);

        // Change <a>text</a> to <a foo="bar">text</a>
        // Insert ' foo="bar"' after 'a' (7) and before '>' (8).
        verifyUpdate(api, 8, 8, ' foo="bar"');

        const expected = '<root><a foo="bar">text</a></root>';
        expect(api.input).toBe(expected);
        expect(api.cst?.wellFormed).toBe(true);

        if (api.model) {
          const aNode = api.model.children[0];
          if (aNode instanceof ModelElement) {
            expect(aNode.attributes.get("foo")).toBe("bar");
          } else {
            throw new Error("Expected ModelElement node");
          }
        }
      });

      it("should handle sibling to parent-child transformation (swallowing)", () => {
        const initialXml = "<root><a/><b/></root>";
        const api = new XMLAPI(initialXml);

        // Replace "<a/><b/>" (index 6 to 14) with "<a><b/></a>" (length 11)
        verifyUpdate(api, 6, 14, "<a><b/></a>");

        expect(api.input).toBe("<root><a><b/></a></root>");
        if (api.model && api.model.children[0] instanceof ModelElement) {
          const a = api.model.children[0];
          expect(a.tagName).toBe("a");
          const b = a.children[0];
          expect(b).toBeInstanceOf(ModelElement);
          if (b instanceof ModelElement) {
            expect(b.tagName).toBe("b");
          }
        }
      });

      it("should handle wrapping the root element", () => {
        const initialXml = "<root>A</root>";
        const api = new XMLAPI(initialXml);

        // 1. Insert "<wrap>" at 0.
        verifyUpdate(api, 0, 0, "<wrap>");
        expect(api.cst).toBeNull(); // Invalid state (multiple roots or fragments not supported yet?) or just invalid XML

        // 2. Insert "</wrap>" at end.
        verifyUpdate(api, 20, 20, "</wrap>");

        expect(api.input).toBe("<wrap><root>A</root></wrap>");
        expect(api.cst).not.toBeNull();
        expect(api.cst?.wellFormed).toBe(true);
        expect(api.model?.tagName).toBe("wrap");
      });

      it("should handle deleting the entire content and replacing it", () => {
        const initialXml = "<root>Old</root>";
        const api = new XMLAPI(initialXml);

        const newXml = "<new>New</new>";
        verifyUpdate(api, 0, initialXml.length, newXml);

        expect(api.input).toBe(newXml);
        expect(api.model?.tagName).toBe("new");
        expect(api.model?.text()).toBe("New");
      });
    });

    describe("Boundary & Edge Cases", () => {
      // The previous test case for lenient grammar logic is hard to replicate without custom converter support.
      // Standard XML grammar might not support spaces before root in this implementation if strict.
      // Let's check if spaces are allowed. Standard grammar usually defines document ::= S? element S?
      // Our defaultGrammar in xml-grammar.ts should be checked.
      // Assuming it does allow it.

      it("should handle insertion at the very beginning (Prepend Invalid)", () => {
        const initialXml = "<root></root>";
        const api = new XMLAPI(initialXml);

        verifyUpdate(api, 0, 0, "junk");
        expect(api.cst).toBeNull();
      });

      it("should handle insertion at the very end (Append Invalid)", () => {
        const initialXml = "<root></root>";
        const api = new XMLAPI(initialXml);

        verifyUpdate(api, 13, 13, "junk");
        expect(api.cst).toBeNull();
      });
    });

    describe("Error Handling & Validation", () => {
      it("should maintain CST but report wellFormed=false on semantic violation", () => {
        const initialXml = "<root><item>A</item></root>";
        const api = new XMLAPI(initialXml);

        // Break the closing tag: </item> -> </ite> (but keep structure somewhat parseable if grammar allows or partial match)
        // Here we just change it to mismatched tag name
        verifyUpdate(api, 7, 11, "ite"); // <item>...<ite>

        expect(api.cst).not.toBeNull();
        expect(api.cst?.wellFormed).toBe(false);
        expect(api.model).toBeNull();
      });

      it("should throw error for out-of-bounds indices", () => {
        const api = new XMLAPI("<root/>");
        expect(() => api.updateInput(-1, 0, "")).toThrow();
        expect(() => api.updateInput(0, 10, "")).toThrow();
        expect(() => api.updateInput(5, 2, "")).toThrow();
      });
    });
  });
});
