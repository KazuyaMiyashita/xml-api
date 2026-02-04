import { Parser } from "../../src/cst/parser";
import { grammar } from "../../src/cst/xml-grammar";
import type { ModelElement, ModelText } from "../../src/model/xml-api-model";
import { XMLBinder } from "../../src/model/xml-binder";

describe("Model Trivia", () => {
  const parser = new Parser(grammar);

  function parseAndHydrate(xml: string) {
    const cst = parser.parse(xml);
    if (!cst) throw new Error("Parse failed");
    const binder = new XMLBinder(xml);
    return binder.hydrate(cst);
  }

  test("classifies pure whitespace as whitespace kind", () => {
    const xml = `<root>
  <child/>
</root>`;
    const root = parseAndHydrate(xml) as ModelElement;

    expect(root.children.length).toBe(3);
    // 0: "\n  " -> whitespace
    const node0 = root.children[0] as ModelText;
    expect(node0.text).toBe("\n  ");
    expect(node0.kind).toBe("whitespace");

    // 1: <child/> -> element
    expect(root.children[1].getType()).toBe("Element");

    // 2: "\n" -> whitespace
    const node2 = root.children[2] as ModelText;
    expect(node2.text).toBe("\n");
    expect(node2.kind).toBe("whitespace");
  });

  test("classifies content text as text kind", () => {
    const xml = "<root>content</root>";
    const root = parseAndHydrate(xml) as ModelElement;
    const text = root.children[0] as ModelText;
    expect(text.kind).toBe("text");
  });

  test("classifies mixed whitespace as text kind", () => {
    const xml = "<root>  content  </root>";
    const root = parseAndHydrate(xml) as ModelElement;
    const text = root.children[0] as ModelText;
    expect(text.kind).toBe("text");
  });

  test("classifies character references as text kind", () => {
    // Even if it is a space
    const xml = "<root>&#x20;</root>";
    const root = parseAndHydrate(xml) as ModelElement;
    const text = root.children[0] as ModelText;
    expect(text.text).toBe(" ");
    expect(text.kind).toBe("text");
  });

  test("reconcile preserves kind", () => {
    // Initial: whitespace
    const xml1 = "<root> </root>";
    const root1 = parseAndHydrate(xml1) as ModelElement;
    const text1 = root1.children[0] as ModelText;
    expect(text1.kind).toBe("whitespace");

    // Update: different whitespace
    const xml2 = "<root>  </root>";
    const cst2 = parser.parse(xml2);
    const binder = new XMLBinder(xml2);

    // Reconcile
    if (!cst2) throw new Error("Parse failed");
    const root2 = binder.reconcile(root1, cst2) as ModelElement;
    const text2 = root2.children[0] as ModelText;

    expect(text2).toBe(text1); // Same instance
    expect(text2.text).toBe("  ");
    expect(text2.kind).toBe("whitespace");

    // Update: content
    const xml3 = "<root>a</root>";
    const cst3 = parser.parse(xml3);
    const binder3 = new XMLBinder(xml3);

    if (!cst3) throw new Error("Parse failed");
    const root3 = binder3.reconcile(root2, cst3) as ModelElement;
    const text3 = root3.children[0] as ModelText;

    expect(text3).toBe(text1);
    expect(text3.text).toBe("a");
    expect(text3.kind).toBe("text");
  });
});
