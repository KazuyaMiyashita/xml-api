import { grammar } from "./minimum-grammar";
import { Parser } from "../core/cst/parser";

describe("Minimum Grammar", () => {
  const parser = new Parser(grammar);

  it("should parse simple attributes", () => {
    const xml = '<root id="1" />';
    const result = parser.parse(xml);
    expect(result).not.toBeNull();
    expect(result?.wellFormed).toBe(true);
  });

  it("should parse simple elements", () => {
    const xml = "<root>content</root>";
    const result = parser.parse(xml);
    expect(result).not.toBeNull();
    expect(result?.wellFormed).toBe(true);
  });
});
