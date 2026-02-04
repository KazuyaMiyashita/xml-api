import { ModelText } from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";

describe("XMLAPI Transaction Management", () => {
  it("should undo and redo updates", () => {
    const api = new XMLAPI("<root>A</root>");

    // Initial state: <root>A</root>

    // Op 1: A -> B
    // <root>A</root>
    // 01234567890123
    // A is at 6-7.
    api.updateSource(6, 7, "B");
    expect(api.source).toBe("<root>B</root>");

    // Op 2: B -> C
    api.updateSource(6, 7, "C");
    expect(api.source).toBe("<root>C</root>");

    // Undo Op 2 -> B
    api.undo();
    expect(api.source).toBe("<root>B</root>");

    // Undo Op 1 -> A
    api.undo();
    expect(api.source).toBe("<root>A</root>");

    // Redo Op 1 -> B
    api.redo();
    expect(api.source).toBe("<root>B</root>");

    // Redo Op 2 -> C
    api.redo();
    expect(api.source).toBe("<root>C</root>");
  });

  it("should handle structural changes", () => {
    const api = new XMLAPI("<root/>");
    // <root/> -> <root>Child</root>
    // Replace "/>" (5-7) with ">Child</root>"
    api.updateSource(5, 7, ">Child</root>");

    // Check model structure
    expect(api.model?.children.length).toBe(1);
    const child = api.model?.children[0];
    expect(child).toBeInstanceOf(ModelText);
    expect((child as ModelText).text).toBe("Child");

    api.undo();
    expect(api.source).toBe("<root/>");
    expect(api.model?.children.length).toBe(0);
  });
});
