import { AST } from "./ast/xml-ast";
import { CST } from "./cst/xml-cst";
import { XMLAPI } from "./xml-api";

describe("AST-CST Mapping", () => {
  it("should attach CST node to AST element", () => {
    const xml = '<root id="1"><child>Text</child></root>';
    const api = new XMLAPI(xml);

    expect(api.ast).toBeInstanceOf(AST);
    const rootAst = api.ast!;
    expect(rootAst.cst).toBeInstanceOf(CST);
    expect(rootAst.cst?.name).toBe("element");
    expect(rootAst.cst?.getText(api.input)).toBe(xml);

    const childAst = rootAst.find("child")[0];
    expect(childAst).toBeInstanceOf(AST);
    expect(childAst.cst).toBeInstanceOf(CST);
    expect(childAst.cst?.name).toBe("element");
    expect(childAst.cst?.getText(api.input)).toBe("<child>Text</child>");
  });

  it("should attach CST node for EmptyElemTag", () => {
    const xml = "<empty/>";
    const api = new XMLAPI(xml);

    const rootAst = api.ast!;
    expect(rootAst.cst).toBeInstanceOf(CST);
    expect(rootAst.cst?.name).toBe("element");
    expect(rootAst.cst?.getText(api.input)).toBe("<empty/>");
  });
});
