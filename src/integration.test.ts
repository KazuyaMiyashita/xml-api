import * as fs from "node:fs";
import * as path from "node:path";
import { AST, ASTCDATA, ASTComment } from "./core/ast/xml-ast";
import { Formatter } from "./core/model/formatter";
import { XMLAPI } from "./core/xml-api";

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

    expect(formatted).toContain("<html");
    expect(formatted).toContain("<title>りんごの選び方</title>");

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
      new AST("p", {}, [
        "りんごを選ぶ際の基準には、以下のような項目があります。",
      ]),
      new AST("ul", {}, [
        new AST("li", {}, ["大きさ"]),
        new AST("li", {}, ["色"]),
        new AST("li", {}, ["硬さ"]),
        new AST("li", {}, ["甘み"]),
        new AST("li", {}, ["酸味"]),
      ]),
      new AST("p", {}, [
        "これら多くの基準を考慮して、自分好みのものを選びましょう。",
      ]),
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

    const expectedInput = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>りんごの選び方</title>
  </head>
  <body>
    <h1>りんごの選び方</h1>
    
    <section>
      <h2>はじめに</h2>
      <p>
        この文書は、自分にぴったりのりんごを選ぶという重要な作業をサポートするためのガイドです。
      </p>
    </section>

    <!-- コメント -->
    <section>
      <h2>りんごを選ぶ基準</h2>
      <p>りんごを選ぶ際の基準には、以下のような項目があります。</p>
      <ul>
        <li>大きさ</li>
        <li>色</li>
        <li>硬さ</li>
        <li>甘み</li>
        <li>酸味</li>
      </ul>
      <p>これら多くの基準を考慮して、自分好みのものを選びましょう。</p>
    </section>
  </body>
</html>
`;
    expect(api.input).toBe(expectedInput);
  });

  it("should support extended features (CDATA, Comments)", () => {
    const api = new XMLAPI(xmlContent);
    const targetSection = api.ast!.find("section")[0]!;
    expect(targetSection).toBeDefined();

    const newContent = new AST("section", {}, [
      new AST("h2", {}, ["Advanced Content"]),
      new ASTComment(" Extended Content "),
      new ASTCDATA("Some <raw> data"),
    ]);

    api.replaceNode(targetSection, newContent);

    expect(api.input).toContain("<!-- Extended Content -->");
    expect(api.input).toContain("<![CDATA[Some <raw> data]]>");

    // Re-parse verification
    const api2 = new XMLAPI(api.input);
    const sections = api2.ast!.find("section");
    const updatedSection = sections[0];

    // Children: h2, Comment, CDATA (and whitespace text nodes potentially)

    const commentNode = updatedSection.children.find(
      (c) => c instanceof ASTComment,
    ) as ASTComment;
    expect(commentNode).toBeDefined();
    expect(commentNode.content).toBe(" Extended Content ");

    const cdataNode = updatedSection.children.find(
      (c) => c instanceof ASTCDATA,
    ) as ASTCDATA;
    expect(cdataNode).toBeDefined();
    expect(cdataNode.content).toBe("Some <raw> data");
  });

  it("should match the full expected XML output after multiple operations (Full Fidelity check)", () => {
    const api = new XMLAPI(xmlContent);

    // 1. Update title content
    const titleText = "りんごの選び方";
    const titleStart = xmlContent.indexOf(titleText);
    api.updateInput(
      titleStart,
      titleStart + titleText.length,
      "美味しいりんごの見分け方",
    );

    // 2. Replace first section with CDATA/Comment content
    const firstSection = api.ast!.find("section")[0]!;
    const newFirstSection = new AST("section", {}, [
      new ASTComment(" Generated by XMLAPI "),
      new ASTCDATA("Copyright <2026>"),
      new AST("p", {}, ["Updated content"]),
    ]);
    api.replaceNode(firstSection, newFirstSection);

    // 3. Replace second section (search by h2 content again)
    const sections = api.ast!.find("section");
    let secondSection: any = null;
    for (const section of sections) {
      const h2 = section.find("h2")[0];
      if (h2 && h2.text() === "選定基準") {
        secondSection = section;
        break;
      }
    }
    const newSecondSection = new AST("section", {}, [
      new AST("h2", {}, ["りんごを選ぶ基準"]),
      new AST("p", {}, [
        "りんごを選ぶ際の基準には、以下のような項目があります。",
      ]),
      new AST("ul", {}, [
        new AST("li", {}, ["大きさ"]),
        new AST("li", {}, ["色"]),
        new AST("li", {}, ["硬さ"]),
        new AST("li", {}, ["甘み"]),
        new AST("li", {}, ["酸味"]),
      ]),
      new AST("p", {}, [
        "これら多くの基準を考慮して、自分好みのものを選びましょう。",
      ]),
    ]);
    api.replaceNode(secondSection, newSecondSection);

    // Verify the entire source string (api.input) to ensure prologs and formatting are preserved
    const expectedInput = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>美味しいりんごの見分け方</title>
  </head>
  <body>
    <h1>りんごの選び方</h1>
    
    <section><!-- Generated by XMLAPI --><![CDATA[Copyright <2026>]]><p>Updated content</p></section>

    <!-- コメント -->
    <section>
      <h2>りんごを選ぶ基準</h2>
      <p>りんごを選ぶ際の基準には、以下のような項目があります。</p>
      <ul>
        <li>大きさ</li>
        <li>色</li>
        <li>硬さ</li>
        <li>甘み</li>
        <li>酸味</li>
      </ul>
      <p>これら多くの基準を考慮して、自分好みのものを選びましょう。</p>
    </section>
  </body>
</html>
`;
    expect(api.input).toBe(expectedInput);

    // Also verify Formatter output for the root AST (html element)
    // Note: Formatter starts from <html> element, so it won't include XML declaration/DOCTYPE
    const formatter = new Formatter({ indent: "  " });
    const formattedHtml = formatter.format(api.ast!);

    const expectedFormattedHtml = `<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>美味しいりんごの見分け方</title>
  </head>
  <body>
    <h1>りんごの選び方</h1>
    
    <section><!-- Generated by XMLAPI --><![CDATA[Copyright <2026>]]><p>Updated content</p></section>

    <!-- コメント -->
    <section>
      <h2>りんごを選ぶ基準</h2>
      <p>りんごを選ぶ際の基準には、以下のような項目があります。</p>
      <ul>
        <li>大きさ</li>
        <li>色</li>
        <li>硬さ</li>
        <li>甘み</li>
        <li>酸味</li>
      </ul>
      <p>これら多くの基準を考慮して、自分好みのものを選びましょう。</p>
    </section>
  </body>
</html>`;

    expect(formattedHtml).toBe(expectedFormattedHtml);
  });
});
