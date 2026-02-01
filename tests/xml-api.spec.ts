import { XMLAPI } from "@/xml-api";

describe("XMLAPI Specification Requirements", () => {
  describe("updateInput(from, to, value)", () => {
    const input = `<root><item id="1">A</item><item id="2">B</item></root>`;
    let api: XMLAPI;

    beforeEach(() => {
      api = new XMLAPI(input);
    });

    it("should be defined only when from <= to", () => {
      expect(() => api.updateInput(5, 4, "")).toThrow();
    });

    it("should be defined only when indices are within the range of the original input string", () => {
      expect(() => api.updateInput(-1, 0, "")).toThrow();
      expect(() => api.updateInput(0, input.length + 1, "")).toThrow();
    });

    it("MUST result in a state identical to a new XMLAPI instance created with the modified string", () => {
      // Operation: Replace "A" with "C"
      const startTag = '<item id="1">';
      const from = input.indexOf("A", input.indexOf(startTag));
      const to = from + 1;
      const value = "C";

      const expectedInput = input.slice(0, from) + value + input.slice(to);
      const expectedApi = new XMLAPI(expectedInput);

      api.updateInput(from, to, value);

      // Verify Input
      expect(api.input).toBe(expectedApi.input);

      // Helper to strip circular references for comparison
      const simplify = (obj: any): any => {
        if (!obj || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(simplify);
        const { parent, cst, id, ...rest } = obj; // Exclude parent, cst, and id (random)
        const newObj: any = {};
        for (const key in rest) {
          newObj[key] = simplify(rest[key]);
        }
        return newObj;
      };

      // Verify CST structure
      expect(JSON.stringify(simplify(api.cst))).toBe(
        JSON.stringify(simplify(expectedApi.cst)),
      );

      // Verify Model structure
      expect(JSON.stringify(simplify(api.model))).toBe(
        JSON.stringify(simplify(expectedApi.model)),
      );

      // Verify well-formedness
      expect(api.cst?.wellFormed).toBe(expectedApi.cst?.wellFormed);
    });

    it("SHOULD perform incremental updates (optimization check)", () => {
      // We spy on the parser to see if it parses the whole string again.
      // Accessing private engine for testing optimization behavior
      const parser = (api as any).engine.parser;
      const parseSpy = jest.spyOn(parser, "parse");
      const parseAtSpy = jest.spyOn(parser, "parseAt");

      // Small change that should be incremental
      // Replace "B" with "D" inside second item
      const startTag = '<item id="2">';
      const from = input.indexOf("B", input.indexOf(startTag));
      const to = from + 1;
      const value = "D";

      api.updateInput(from, to, value);

      // Should verify that full parse was NOT called
      expect(parseAtSpy).toHaveBeenCalled();
      expect(parseSpy).not.toHaveBeenCalled();
    });
  });
});
