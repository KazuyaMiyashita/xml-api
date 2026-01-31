import { grammar } from "./core/cst/xml-grammar";
import { Parser } from "./core/cst/parser";
import { convert } from "./core/model/xml-binder";
import { AST } from "./core/ast/xml-ast";
import { XMLAPI } from "./core/xml-api";
import { Formatter } from "./core/model/formatter";
import * as fs from "fs";
import * as path from "path";

describe("Integration Test", () => {
  const xmlPath = path.join(__dirname, "core/sample_01.xml");
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

    api.updateInput(startPos, startPos + targetText.length, newText);

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

  it("should replace node using AST construction", () => {
    const api = new XMLAPI(xmlContent);
    const sections = api.ast!.find("section");
    let targetSection: any = null;
    
    for (const section of sections) {
        const h2 = section.find("h2")[0];
        if (h2 && h2.text() === "選定基準") {
            targetSection = section;
            break;
        }
    }
    
    expect(targetSection).not.toBeNull();

    // Construct new content using AST
    const newSectionAst = new AST("section", {}, [
      new AST("h2", {}, ["りんごを選ぶ基準"]),
      new AST("p", {}, ["りんごを選ぶ際の基準には、以下のような項目があります。"]),
      new AST("ul", {}, [
        new AST("li", {}, ["大きさ"]),
        new AST("li", {}, ["色"]),
        new AST("li", {}, ["硬さ"]),
        new AST("li", {}, ["甘み"]),
        new AST("li", {}, ["酸味"]),
      ]),
      new AST("p", {}, ["これら多くの基準を考慮して、自分好みのものを選びましょう。"]),
    ]);

    api.replaceNode(targetSection, newSectionAst);
    
    // Verify Update
    const newSections = api.ast!.find("section");
    let updatedSection: any = null;
    for (const section of newSections) {
        const h2 = section.find("h2")[0];
        if (h2 && h2.text() === "りんごを選ぶ基準") {
            updatedSection = section;
            break;
        }
    }
    
    expect(updatedSection).not.toBeNull();
    expect(updatedSection.find("li").length).toBe(5);
    
    // Verify source update
    expect(api.input).toContain("<li>大きさ</li>");
  });
});
