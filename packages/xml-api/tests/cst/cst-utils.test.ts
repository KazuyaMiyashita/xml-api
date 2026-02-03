import { CST } from "../../src/cst/xml-cst";
import { detectIndent } from "../../src/cst/cst-utils";

describe("CST Utils", () => {
  describe("detectIndent", () => {
    it("detects 2-space indentation", () => {
      const source = "<root>\n  <item />\n</root>";
      // <item /> is at index 9 (after "\n  ")
      const node = new CST("element", "element", 9, 17); // <item />
      const indent = detectIndent(node, source);
      expect(indent).toBe("  ");
    });

    it("detects tab indentation", () => {
      const source = "<root>\n\t<item />\n</root>";
      const node = new CST("element", "element", 8, 16);
      const indent = detectIndent(node, source);
      expect(indent).toBe("\t");
    });

    it("returns null if on same line as other content", () => {
      const source = "<root><item /></root>";
      const node = new CST("element", "element", 6, 14);
      const indent = detectIndent(node, source);
      expect(indent).toBeNull();
    });

    it("returns empty string (not null) for root node at start", () => {
      const source = "<root />";
      const node = new CST("element", "element", 0, 8);
      const indent = detectIndent(node, source);
      expect(indent).toBe("");
    });

    it("detects indent at start of file if preceded by whitespace", () => {
      const source = "  <root />";
      const node = new CST("element", "element", 2, 10);
      const indent = detectIndent(node, source);
      expect(indent).toBe("  ");
    });
    
    it("handles mixed indent", () => {
      const source = "<div>\n  \t<span></span></div>";
      const node = new CST("element", "element", 9, 22);
      const indent = detectIndent(node, source);
      expect(indent).toBe("  \t");
    });
  });
});