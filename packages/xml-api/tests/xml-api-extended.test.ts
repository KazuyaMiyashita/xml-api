import { CDATASection, Comment } from "@/dom";
import { XMLAPI } from "@/xml-api";

describe("XMLAPI Extended Support (CDATA & Comment)", () => {
  it("should parse and preserve CDATA sections", () => {
    const input = `<root><![CDATA[Some <data>]]></root>`;
    const api = new XMLAPI(input);
    const doc = api.getDocument();

    expect(api.model?.children.length).toBe(1);
    if (!doc.documentElement || !doc.documentElement.firstChild)
      throw new Error("Child not found");
    const child = doc.documentElement.firstChild;

    expect(child).toBeInstanceOf(CDATASection);
    expect((child as CDATASection).data).toBe("Some <data>");

    const newCData = doc.createCDATASection("New <Content>");
    doc.documentElement?.replaceChild(newCData, child);

    expect(api.source).toBe(`<root><![CDATA[New <Content>]]></root>`);
  });

  it("should handle Comment updates", () => {
    const input = `<root><!-- Old Comment --></root>`;
    const api = new XMLAPI(input);
    const doc = api.getDocument();

    if (!doc.documentElement || !doc.documentElement.firstChild)
      throw new Error("Comment not found");
    const comment = doc.documentElement.firstChild;
    expect(comment).toBeInstanceOf(Comment);

    const newComment = doc.createComment(" New Comment ");
    doc.documentElement?.replaceChild(newComment, comment);

    expect(api.source).toBe(`<root><!-- New Comment --></root>`);
  });
});
