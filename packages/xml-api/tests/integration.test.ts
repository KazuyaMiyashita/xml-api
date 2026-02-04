import * as fs from "node:fs";
import * as path from "node:path";
import { Formatter } from "@/model/formatter";
import {
  ModelCDATA,
  ModelComment,
  ModelElement,
  type ModelNode,
  ModelText,
} from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";
import { Document, Node, Element } from "@/dom";

function h(
  doc: Document,
  tagName: string,
  attrs: { [key: string]: string } = {},
  children: (Node | string)[] = [],
): Element {
  const el = doc.createElement(tagName);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === "string") {
      el.appendChild(doc.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

describe("Integration Tests", () => {
  let xmlContent: string;
  beforeAll(() => {
    const xmlPath = path.join(__dirname, "sample_01.xml");
    xmlContent = fs.readFileSync(xmlPath, "utf8");
  });

  it("should parse and convert sample_01.xml correctly", () => {
    const api = new XMLAPI(xmlContent);

    expect(api.cst).not.toBeNull();
    expect(api.cst?.wellFormed).toBe(true);
    expect(api.model).toBeInstanceOf(ModelElement);

    const model = api.model!;
    expect(model.tagName).toBe("html");
    expect(model.attributes.get("xml:lang")).toBe("ja");

    const titles = model.find("title");
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0].text()).toBe("りんごの選び方");

    // Check Enhanced Model (CST Mapping)
    expect(titles[0].cst).not.toBeNull();
    expect(titles[0].cst?.getText(api.source)).toContain("りんごの選び方");
  });

  it("should perform incremental updates and preserve Model identity", () => {
    const api = new XMLAPI(xmlContent);
    const initialModel = api.model!;

    const targetText = "りんごの選び方";
    const startPos = xmlContent.indexOf(targetText);
    const newText = "Mod";

    api.updateSource(startPos, startPos + targetText.length, newText);

    expect(api.model).toBe(initialModel); // Differential Update: Identity preserved
    expect(api.model?.find("title")[0].text()).toBe(newText);
    expect(api.cst?.wellFormed).toBe(true);
  });

  it("should format the Model back to a valid XML string", () => {
    const api = new XMLAPI(xmlContent);
    const formatter = new Formatter();
    const formatted = formatter.format(api.model!);

    expect(formatted).toContain("<html");
    expect(formatted).toContain("<title>りんごの選び方</title>");

    // The formatted output should be parseable again
    const api2 = new XMLAPI(formatted);
    expect(api2.cst?.wellFormed).toBe(true);
    expect(api2.model?.tagName).toBe("html");
  });

  it("should replace node using DOM manipulation", () => {
    const api = new XMLAPI(xmlContent);
    const doc = api.getDocument();
    const sections = doc.querySelectorAll("section");
    let targetSection: Element | null = null;

    for (const section of sections as any) {
      // NodeList is iterable
      const h2 = (section as Element).querySelector("h2");
      if (h2 && h2.textContent === "選定基準") {
        targetSection = section as Element;
        break;
      }
    }

    expect(targetSection).not.toBeNull();

    // Construct new content using DOM
    const newSection = h(doc, "section", {}, [
      h(doc, "h2", {}, ["りんごを選ぶ基準"]),
      h(doc, "p", {}, [
        "りんごを選ぶ際の基準には、以下のような項目があります。",
      ]),
      h(doc, "ul", {}, [
        h(doc, "li", {}, ["大きさ"]),
        h(doc, "li", {}, ["色"]),
        h(doc, "li", {}, ["硬さ"]),
        h(doc, "li", {}, ["甘み"]),
        h(doc, "li", {}, ["酸味"]),
      ]),
      h(doc, "p", {}, [
        "これら多くの基準を考慮して、自分好みのものを選びましょう。",
      ]),
    ]);

    targetSection!.parentNode!.replaceChild(newSection, targetSection!);

    // Verify Update
    const newSections = api.model!.find("section");
    let updatedSection: ModelElement | null = null;
    for (const section of newSections) {
      const h2 = section.find("h2")[0];
      if (h2 && h2.text() === "りんごを選ぶ基準") {
        updatedSection = section;
        break;
      }
    }

    expect(updatedSection).not.toBeNull();
    expect(updatedSection!.find("li").length).toBe(5);

    // Verify source update
    expect(api.source).toContain("<li>大きさ</li>");

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
    expect(api.source).toBe(expectedInput);
  });

  it("should support extended features (CDATA, Comments)", () => {
    const api = new XMLAPI(xmlContent);
    const doc = api.getDocument();
    const sections = doc.querySelectorAll("section");
    const targetSection = sections[0] as Element;
    expect(targetSection).toBeDefined();

    const newContent = h(doc, "section", {}, [
      h(doc, "h2", {}, ["Advanced Content"]),
      doc.createComment(" Extended Content "),
      doc.createCDATASection("Some <raw> data"),
    ]);

    targetSection.parentNode!.replaceChild(newContent, targetSection);

    expect(api.source).toContain("<!-- Extended Content -->");
    expect(api.source).toContain("<![CDATA[Some <raw> data]]>");

    // Re-parse verification
    const api2 = new XMLAPI(api.source);
    const modelSections = api2.model!.find("section");
    const updatedSection = modelSections[0];

    // Children: h2, Comment, CDATA (and whitespace text nodes potentially)

    const commentNode = updatedSection.children.find(
      (c) => c instanceof ModelComment,
    ) as ModelComment;
    expect(commentNode).toBeDefined();
    expect(commentNode.content).toBe(" Extended Content ");

    const cdataNode = updatedSection.children.find(
      (c) => c instanceof ModelCDATA,
    ) as ModelCDATA;
    expect(cdataNode).toBeDefined();
    expect(cdataNode.content).toBe("Some <raw> data");
  });

  it("should match the full expected XML output after multiple operations (Full Fidelity check)", () => {
    const api = new XMLAPI(xmlContent);
    const doc = api.getDocument();

    // 1. Update title content
    const titleText = "りんごの選び方";
    const titleStart = xmlContent.indexOf(titleText);
    api.updateSource(
      titleStart,
      titleStart + titleText.length,
      "美味しいりんごの見分け方",
    );

    // 2. Replace first section with CDATA/Comment content
    const firstSection = doc.querySelectorAll("section")[0] as Element;
    const newFirstSection = h(doc, "section", {}, [
      doc.createComment(" Generated by XMLAPI "),
      doc.createCDATASection("Copyright <2026>"),
      h(doc, "p", {}, ["Updated content"]),
    ]);
    firstSection.parentNode!.replaceChild(newFirstSection, firstSection);

    // 3. Replace second section (search by h2 content again)
    const sections = doc.querySelectorAll("section");
    let secondSection: Element | null = null;
    for (const section of sections as any) {
      const h2 = (section as Element).querySelector("h2");
      if (h2 && h2.textContent === "選定基準") {
        secondSection = section as Element;
        break;
      }
    }
    const newSecondSection = h(doc, "section", {}, [
      h(doc, "h2", {}, ["りんごを選ぶ基準"]),
      h(doc, "p", {}, [
        "りんごを選ぶ際の基準には、以下のような項目があります。",
      ]),
      h(doc, "ul", {}, [
        h(doc, "li", {}, ["大きさ"]),
        h(doc, "li", {}, ["色"]),
        h(doc, "li", {}, ["硬さ"]),
        h(doc, "li", {}, ["甘み"]),
        h(doc, "li", {}, ["酸味"]),
      ]),
      h(doc, "p", {}, [
        "これら多くの基準を考慮して、自分好みのものを選びましょう。",
      ]),
    ]);
    secondSection!.parentNode!.replaceChild(newSecondSection, secondSection!);

    // Verify the entire source string (api.source)
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
    expect(api.source).toBe(expectedInput);

    // Also verify Formatter output for the root Model (html element)
    const formatter = new Formatter({ indent: "  " });
    const formattedHtml = formatter.format(api.model!);

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
