import { ModelCDATA, ModelComment } from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";
import { CDATASection, Comment } from "@/dom";

describe("XMLAPI Extended Support (CDATA & Comment)", () => {
  it("should parse and preserve CDATA sections", () => {
    const input = `<root><![CDATA[Some <data>]]></root>`;
    const api = new XMLAPI(input);
    const doc = api.getDocument();

    expect(api.model?.children.length).toBe(1);
    const child = doc.documentElement!.firstChild!;

    expect(child).toBeInstanceOf(CDATASection);
    expect((child as CDATASection).data).toBe("Some <data>");

    const newCData = doc.createCDATASection("New <Content>");
    doc.documentElement!.replaceChild(newCData, child);

    expect(api.source).toBe(`<root><![CDATA[New <Content>]]></root>`);
  });

  it("should handle Comment updates", () => {
    const input = `<root><!-- Old Comment --></root>`;
    const api = new XMLAPI(input);
    const doc = api.getDocument();

    const comment = doc.documentElement!.firstChild!;
    expect(comment).toBeInstanceOf(Comment);

    const newComment = doc.createComment(" New Comment ");
    doc.documentElement!.replaceChild(newComment, comment);

    expect(api.source).toBe(`<root><!-- New Comment --></root>`);
  });
});
