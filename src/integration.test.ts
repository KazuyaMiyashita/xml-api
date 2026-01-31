import { grammar } from "./xml-grammar";
import { Parser } from "./parser";
import { convert } from "./xml-converter";
import { AST } from "./xml-ast";
import { XMLAPI } from "./xml-api";
import { Formatter } from "./formatter";
import * as fs from "fs";
import * as path from "path";

describe("Integration Test", () => {
  const xmlPath = path.join(__dirname, "sample_01.xml");
  const xmlContent = fs.readFileSync(xmlPath, "utf8");

  it("should parse and convert sample_01.xml correctly", () => {
    const api = new XMLAPI(xmlContent);

    expect(api.cst).not.toBeNull();
    expect(api.cst?.wellFormed).toBe(true);
    expect(api.ast).toBeInstanceOf(AST);

    const ast = api.ast!;
    expect(ast.tagName).toBe("html");
    expect(ast.attr("xml:lang")).toBe("ja");

    const titles = ast.find("title");
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0].text()).toBe("りんごの選び方");

    // Check Enhanced AST (CST Mapping)
    expect(titles[0].cst).not.toBeNull();
    expect(titles[0].cst?.getText(api.input)).toContain("りんごの選び方");
  });

  it("should perform incremental updates and preserve AST identity", () => {
    const api = new XMLAPI(xmlContent);
    const initialAst = api.ast!;

    const targetText = "りんごの選び方";
    const startPos = xmlContent.indexOf(targetText);
    const newText = "Mod";

    api.update_input(startPos, startPos + targetText.length, newText);

    expect(api.ast).toBe(initialAst); // Differential Update: Identity preserved
    expect(api.ast?.find("title")[0].text()).toBe(newText);
    expect(api.cst?.wellFormed).toBe(true);
  });

  it("should format the AST back to a valid XML string", () => {
    const api = new XMLAPI(xmlContent);
    const formatter = new Formatter();
    const formatted = formatter.format(api.ast!);

    expect(formatted).toContain('<html');
    expect(formatted).toContain('<title>りんごの選び方</title>');

    // The formatted output should be parseable again
    const api2 = new XMLAPI(formatted);
    expect(api2.cst?.wellFormed).toBe(true);
    expect(api2.ast?.tagName).toBe("html");
  });
});
