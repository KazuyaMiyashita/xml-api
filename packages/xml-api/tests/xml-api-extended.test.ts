import { ModelCDATA, ModelComment } from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";

describe("XMLAPI Extended Support (CDATA & Comment)", () => {
  it("should parse and preserve CDATA sections", () => {
    const input = `<root><![CDATA[Some <data>]]></root>`;
    const api = new XMLAPI(input);

    expect(api.model?.children.length).toBe(1);
    const child = api.model?.children[0];

    expect(child).toBeInstanceOf(ModelCDATA);
    expect((child as ModelCDATA).content).toBe("Some <data>");

    const newCData = new ModelCDATA("New <Content>");
    api.replaceNode(child as any, newCData as any);

    expect(api.input).toBe(`<root><![CDATA[New <Content>]]></root>`);
  });

  it("should handle Comment updates", () => {
    const input = `<root><!-- Old Comment --></root>`;
    const api = new XMLAPI(input);

    const comment = api.model?.children[0];
    expect(comment).toBeInstanceOf(ModelComment);

    const newComment = new ModelComment(" New Comment ");
    api.replaceNode(comment as any, newComment as any);

    expect(api.input).toBe(`<root><!-- New Comment --></root>`);
  });
});
