import { XMLAPI } from "./xml-api";
import { AST } from "./ast/xml-ast";
import { CST } from "./cst/xml-cst";

describe("AST-CST Mapping", () => {
  it("should attach CST node to AST element", () => {
    const xml = '<root id="1"><child>Text</child></root>';
    const api = new XMLAPI(xml);

    expect(api.ast).toBeInstanceOf(AST);
    const rootAst = api.ast!;
    expect(rootAst.cst).toBeInstanceOf(CST);
    expect(rootAst.cst!.name).toBe("element");
    expect(rootAst.cst!.getText(api.input)).toBe(xml);

    const childAst = rootAst.find("child")[0];
    expect(childAst).toBeInstanceOf(AST);
    expect(childAst.cst).toBeInstanceOf(CST);
    expect(childAst.cst!.name).toBe("element");
    expect(childAst.cst!.getText(api.input)).toBe("<child>Text</child>");
  });

  it("should attach CST node for EmptyElemTag", () => {
    const xml = "<empty/>";
    const api = new XMLAPI(xml);

    const rootAst = api.ast!;
    expect(rootAst.cst).toBeInstanceOf(CST);
    expect(rootAst.cst!.name).toBe("element");
    expect(rootAst.cst!.getText(api.input)).toBe("<empty/>");
  });
  
  it("should work with minimum-grammar", () => {
     // We need to import minGrammar/minConvert dynamically or from source
     // but for simplicity let's rely on default behavior or mock if needed.
     // Actually I can import them.
     const { grammar: minGrammar } = require("../experiments/minimum-grammar");
     const { convert: minConvert } = require("../experiments/minimum-converter");
     
     const xml = "<root><child/></root>";
     const api = new XMLAPI(xml, minGrammar, minConvert);
     
     const rootAst = api.ast!;
     expect(rootAst.cst).toBeInstanceOf(CST);
     // In minimum-grammar, root might be 'document' wrapping 'element', 
     // or 'element' depending on how it parses. 
     // Our converter logic resolves document->element.
     // Let's check name.
     // If api.cst is document, and rootAst.cst should be element.
     expect(api.cst!.name).toBe("document");
     expect(rootAst.cst!.name).toBe("element");
     
     const childAst = rootAst.children[0] as AST;
     expect(childAst.tagName).toBe("child");
     expect(childAst.cst).toBeInstanceOf(CST);
     expect(childAst.cst!.name).toBe("element"); // Reference to element
  });
});
