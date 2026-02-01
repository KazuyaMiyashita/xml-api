import { AST } from "@/ast/xml-ast";
import { XMLAPI } from "@/xml-api";

describe("Incremental AST Update", () => {
  it("should preserve AST object identity for unaffected ancestors", () => {
    const xml = '<root><a id="1">TextA</a><b id="2">TextB</b></root>';
    const api = new XMLAPI(xml);

    const rootAst = api.ast!;
    const aAst = rootAst.children[0] as AST;
    const bAst = rootAst.children[1] as AST;

    // Update TextA -> TextModified
    // This affects 'a' element.
    // 'a' CST will be updated (or its content).
    // The anchor should be 'a' element (or 'root' if we bubble up).
    // If we update text content, anchor is 'a'.

    // Change "TextA" (index 14-19) to "Mod"
    // <root><a id="1">TextA</a>...
    // <root> is 0-6.
    // <a id="1"> is 6-16?
    // 0123456789012345
    // <root><a id="1">
    // T is at 16.

    const start = xml.indexOf("TextA");
    const end = start + "TextA".length;

    api.updateInput(start, end, "Mod");

    expect(api.ast).toBe(rootAst); // Root object preserved

    // 'b' is sibling. If 'root' was re-converted, 'b' would be new object.
    // If 'a' was re-converted, 'b' should be preserved?
    // Wait, if 'a' is re-converted, 'root' is NOT re-converted.
    // So 'root.children' should still contain 'bAst'?
    // 'root.children' is array.
    // If we updated 'a', did we update 'root'?
    // If anchor is 'a', we updated 'a' in-place.
    // 'root.children[0]' is 'aAst'.
    // 'aAst' is mutated.
    // 'root.children[1]' is 'bAst'.
    // So 'bAst' should be preserved.

    const newRoot = api.ast!;
    const newA = newRoot.children[0] as AST;
    const newB = newRoot.children[1] as AST;

    expect(newRoot).toBe(rootAst);
    expect(newA).toBe(aAst); // 'a' AST object preserved (mutated in place)
    expect(newB).toBe(bAst); // 'b' AST object preserved (touched only via parent array reference which didn't change)

    expect(newA.text()).toBe("Mod");
  });

  it("should regenerate subtree when structure changes", () => {
    // <root><a>Old</a></root> -> <root><a><n>New</n></a></root>
    const xml = "<root><a>Old</a></root>";
    const api = new XMLAPI(xml);
    const rootAst = api.ast!;
    const aAst = rootAst.children[0] as AST;

    const start = xml.indexOf("Old");
    api.updateInput(start, start + 3, "<n>New</n>");

    expect(api.ast).toBe(rootAst);
    expect(api.ast?.children[0]).toBe(aAst);

    const newA = api.ast?.children[0] as AST;
    expect(newA.children[0]).toBeInstanceOf(AST);
    expect((newA.children[0] as AST).tagName).toBe("n");
  });

  it("should fallback to full regen if anchor not found (e.g. root replacement)", () => {
    const xml = "<root>A</root>";
    const api = new XMLAPI(xml);
    const rootAst = api.ast!;

    // Replace whole string
    api.updateInput(0, xml.length, "<new>B</new>");

    expect(api.ast).toBe(rootAst);
    expect(api.ast?.tagName).toBe("new");
  });
});
