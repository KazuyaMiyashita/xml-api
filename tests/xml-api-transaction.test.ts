import { XMLAPI } from "@/xml-api";

describe("XMLAPI Transaction Management", () => {
  it("should undo and redo updates", () => {
    const api = new XMLAPI("<root>A</root>");

    // Initial state: <root>A</root>

    // Op 1: A -> B
    // <root>A</root>
    // 01234567890123
    // A is at 6-7.
    api.updateInput(6, 7, "B");
    expect(api.input).toBe("<root>B</root>");

    // Op 2: B -> C
    api.updateInput(6, 7, "C");
    expect(api.input).toBe("<root>C</root>");

    // Undo Op 2 -> B
    api.undo();
    expect(api.input).toBe("<root>B</root>");

    // Undo Op 1 -> A
    api.undo();
    expect(api.input).toBe("<root>A</root>");

    // Redo Op 1 -> B
    api.redo();
    expect(api.input).toBe("<root>B</root>");

    // Redo Op 2 -> C
    api.redo();
    expect(api.input).toBe("<root>C</root>");
  });

  it("should handle structural changes", () => {
    const api = new XMLAPI("<root/>");
    // <root/> -> <root>Child</root>
    // Replace "/>" (5-7) with ">Child</root>"
    api.updateInput(5, 7, ">Child</root>");
    expect(api.ast?.children[0]).toBe("Child");

    api.undo();
    expect(api.input).toBe("<root/>");
    expect(api.ast?.children.length).toBe(0);
  });
});
