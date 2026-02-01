import { ModelElement, ModelText } from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";

describe("Incremental Model Update", () => {
  it("should preserve Model object identity for unaffected ancestors", () => {
    const xml = '<root><a id="1">TextA</a><b id="2">TextB</b></root>';
    const api = new XMLAPI(xml);

    const rootModel = api.model!;
    const aModel = rootModel.children[0] as ModelElement;
    const bModel = rootModel.children[1] as ModelElement;

    const start = xml.indexOf("TextA");
    const end = start + "TextA".length;

    api.updateInput(start, end, "Mod");

    expect(api.model).toBe(rootModel); // Root object preserved

    const newRoot = api.model!;
    const newA = newRoot.children[0] as ModelElement;
    const newB = newRoot.children[1] as ModelElement;

    expect(newRoot).toBe(rootModel);
    expect(newA).toBe(aModel); // 'a' object preserved (mutated in place)
    expect(newB).toBe(bModel); // 'b' object preserved

    expect(newA.text()).toBe("Mod");
  });

  it("should regenerate subtree when structure changes", () => {
    // <root><a>Old</a></root> -> <root><a><n>New</n></a></root>
    const xml = "<root><a>Old</a></root>";
    const api = new XMLAPI(xml);
    const rootModel = api.model!;
    const aModel = rootModel.children[0] as ModelElement;

    const start = xml.indexOf("Old");
    api.updateInput(start, start + 3, "<n>New</n>");

    expect(api.model).toBe(rootModel);
    expect(api.model?.children[0]).toBe(aModel);

    const newA = api.model?.children[0] as ModelElement;
    expect(newA.children[0]).toBeInstanceOf(ModelElement);
    expect((newA.children[0] as ModelElement).tagName).toBe("n");
  });

  it("should fallback to full regen (new object) if root is replaced", () => {
    const xml = "<root>A</root>";
    const api = new XMLAPI(xml);
    const rootModel = api.model!;

    // Replace whole string
    api.updateInput(0, xml.length, "<new>B</new>");

    // Expect new root object because we replaced the root
    expect(api.model).not.toBe(rootModel);
    expect(api.model?.tagName).toBe("new");
  });
});
