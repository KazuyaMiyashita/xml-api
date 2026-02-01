import { ModelElement } from "@/model/xml-api-model";
import { CST } from "@/cst/xml-cst";
import { XMLAPI } from "@/xml-api";

describe("Model-CST Mapping", () => {
  it("should attach CST node to Model element", () => {
    const xml = '<root id="1"><child>Text</child></root>';
    const api = new XMLAPI(xml);

    expect(api.model).toBeInstanceOf(ModelElement);
    const root = api.model!;
    expect(root.cst).toBeInstanceOf(CST);
    expect(root.cst?.name).toBe("element");
    expect(root.cst?.getText(api.input)).toBe(xml);

    const child = root.find("child")[0];
    expect(child).toBeInstanceOf(ModelElement);
    expect(child.cst).toBeInstanceOf(CST);
    expect(child.cst?.name).toBe("element");
    expect(child.cst?.getText(api.input)).toBe("<child>Text</child>");
  });

  it("should attach CST node for EmptyElemTag", () => {
    const xml = "<empty/>";
    const api = new XMLAPI(xml);

    const root = api.model!;
    expect(root.cst).toBeInstanceOf(CST);
    expect(root.cst?.name).toBe("element");
    expect(root.cst?.getText(api.input)).toBe("<empty/>");
  });
});
