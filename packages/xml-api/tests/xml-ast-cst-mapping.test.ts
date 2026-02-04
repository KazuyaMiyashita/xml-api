import { CST } from "@/cst/xml-cst";
import { ModelElement } from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";

describe("Model-CST Mapping", () => {
  it("should attach CST node to Model element", () => {
    const xml = '<root id="1"><child>Text</child></root>';
    const api = new XMLAPI(xml);

    expect(api.model).toBeInstanceOf(ModelElement);
    if (!api.model) throw new Error("Model is null");
    const root = api.model;
    expect(root.cst).toBeInstanceOf(CST);
    expect(root.cst?.name).toBe("element");
    expect(root.cst?.getText(api.source)).toBe(xml);

    const child = root.find("child")[0];
    expect(child).toBeInstanceOf(ModelElement);
    expect(child.cst).toBeInstanceOf(CST);
    expect(child.cst?.name).toBe("element");
    expect(child.cst?.getText(api.source)).toBe("<child>Text</child>");
  });

  it("should attach CST node for EmptyElemTag", () => {
    const xml = "<empty/>";
    const api = new XMLAPI(xml);

    if (!api.model) throw new Error("Model is null");
    const root = api.model;
    expect(root.cst).toBeInstanceOf(CST);
    expect(root.cst?.name).toBe("element");
    expect(root.cst?.getText(api.source)).toBe("<empty/>");
  });
});
