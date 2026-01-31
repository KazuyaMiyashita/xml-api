import { XMLBinder } from "./xml-binder";
import { Parser } from "../cst/parser";
import { grammar } from "../cst/xml-grammar";
import { ModelElement } from "./xml-api-model";

describe("XMLBinder Key-based Reconciliation", () => {
  const parser = new Parser(grammar);

  it("should preserve node identity when inserting an element before it", () => {
    // Initial state: A, B
    const input1 = `<list>
  <item id="A">Item A</item>
  <item id="B">Item B</item>
</list>`;
    const binder1 = new XMLBinder(input1);
    const cst1 = parser.parse(input1, "element");
    if (!cst1) throw new Error("Parse failed for input1");
    const model = binder1.hydrate(cst1) as ModelElement;

    // Model children structure depends on whitespace.
    // <list> (start)
    //   \n  (text)
    //   <item> (element)
    //   \n  (text)
    //   <item> (element)
    //   \n (text)
    // </list>

    // Let's filter elements for easier access in test
    const elements = model.children.filter(
      (c) => c.getType() === "Element",
    ) as ModelElement[];
    const itemA = elements[0];
    const itemB = elements[1];

    expect(itemA.attributes.get("id")).toBe("A");
    expect(itemB.attributes.get("id")).toBe("B");

    // New state: C, A, B (Inserted C at the beginning)
    const input2 = `<list>
  <item id="C">Item C</item>
  <item id="A">Item A</item>
  <item id="B">Item B</item>
</list>`;
    const binder2 = new XMLBinder(input2);
    const cst2 = parser.parse(input2, "element");
    if (!cst2) throw new Error("Parse failed for input2");

    // Reconcile
    binder2.reconcile(model, cst2);

    const newElements = model.children.filter(
      (c) => c.getType() === "Element",
    ) as ModelElement[];
    const newItemC = newElements[0];
    const newItemA = newElements[1];
    const newItemB = newElements[2];

    expect(newItemC.attributes.get("id")).toBe("C");
    expect(newItemA.attributes.get("id")).toBe("A");
    expect(newItemB.attributes.get("id")).toBe("B");

    // Check Identity
    // itemA should match newItemA
    expect(newItemA).toBe(itemA);
    // itemB should match newItemB
    expect(newItemB).toBe(itemB);
  });
});
