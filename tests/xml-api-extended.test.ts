import { ASTCDATA, ASTComment } from "@/ast/xml-ast";
import { XMLAPI } from "@/xml-api";

describe("XMLAPI Extended Support (CDATA & Comment)", () => {
  it("should parse and preserve CDATA sections", () => {
    const input = `<root><![CDATA[Some <data>]]></root>`;
    const api = new XMLAPI(input);

    expect(api.ast?.children.length).toBe(1);
    const child = api.ast?.children[0];

    expect(child).toBeInstanceOf(ASTCDATA);
    expect((child as ASTCDATA).text()).toBe("Some <data>");

    // To verify fidelity, we can modify it and check output
    (child as ASTCDATA).content = "New & <data>";

    // Replace the root's child with the modified CDATA
    // (This is a bit tricky since AST modification alone doesn't update source unless we use an API)
    // But XMLAPI model update should work.

    // Actually, let's use replaceNode to insert a new CDATA
    const _root = api.ast!;
    const newCData = new ASTCDATA("New <Content>");
    api.replaceNode(child as any, newCData as any); // Type assertion until AST types are updated

    expect(api.input).toBe(`<root><![CDATA[New <Content>]]></root>`);
  });

  it("should handle Comment updates", () => {
    const input = `<root><!-- Old Comment --></root>`;
    const api = new XMLAPI(input);

    const comment = api.ast?.children[0];
    expect(comment).toBeInstanceOf(ASTComment);

    const newComment = new ASTComment(" New Comment ");
    api.replaceNode(comment as any, newComment as any);

    expect(api.input).toBe(`<root><!-- New Comment --></root>`);
  });
});
