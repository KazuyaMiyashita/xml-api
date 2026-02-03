import { XMLBinder } from "../../src/model/xml-binder";
import { Parser } from "../../src/cst/parser";
import { grammar } from "../../src/cst/xml-grammar";
import { ModelElement, ModelNodeType } from "../../src/model/xml-api-model";

describe("XMLBinder - Formatting Hints", () => {
  const parse = (xml: string) => {
    const parser = new Parser(grammar);
    const cst = parser.parse(xml);
    if (!cst) throw new Error("Parse failed");
    const binder = new XMLBinder(xml);
    return binder.hydrate(cst);
  };

  it("captures indentation for indented elements", () => {
    const xml = `<root>\n  <child />\n</root>`;
    const root = parse(xml) as ModelElement;
    
    expect(root.tagName).toBe("root");
    // Root is at start of file, so indent is empty string (not null) unless it was indented
    // If xml starts with <root>, indent is "" (start of file/line)
    expect(root.formatting.indent).toBe("");

    // Child should be indented
    const child = root.children.find(c => c.getType() === ModelNodeType.Element) as ModelElement;
    expect(child).toBeDefined();
    expect(child.formatting.indent).toBe("  ");
  });

  it("captures null indentation for inline elements", () => {
    const xml = `<p>Text <b>Bold</b></p>`;
    const p = parse(xml) as ModelElement;
    
    expect(p.formatting.indent).toBe(""); // Start of file

    const b = p.children.find(c => c.getType() === ModelNodeType.Element) as ModelElement;
    expect(b.tagName).toBe("b");
    expect(b.formatting.indent).toBeNull();
  });

  it("captures nested indentation", () => {
    const xml = `<root>\n  <list>\n    <item />\n  </list>\n</root>`;
    const root = parse(xml) as ModelElement;
    
    const list = root.children.find(c => (c as ModelElement).tagName === "list") as ModelElement;
    expect(list.formatting.indent).toBe("  ");

    const item = list.children.find(c => (c as ModelElement).tagName === "item") as ModelElement;
    expect(item.formatting.indent).toBe("    ");
  });

  it("captures empty string for root if at start of file", () => {
    const xml = `<root />`;
    const root = parse(xml) as ModelElement;
    expect(root.formatting.indent).toBe("");
  });

  it("captures indent if root is indented", () => {
    const xml = `  <root />`;
    const root = parse(xml) as ModelElement;
    expect(root.formatting.indent).toBe("  ");
  });
});
