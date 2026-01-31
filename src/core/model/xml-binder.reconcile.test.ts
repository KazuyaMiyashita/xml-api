import { XMLBinder } from "./xml-binder";
import { Parser } from "../cst/parser";
import { grammar } from "../cst/xml-grammar";
import { ModelElement, ModelText } from "./xml-api-model";

describe("XMLBinder Reconciliation", () => {
  const parser = new Parser(grammar);

  it("should preserve element identity when attributes change", () => {
    const input1 = '<root id="1">Text</root>';
    const binder1 = new XMLBinder(input1);
    const cst1 = parser.parse(input1, "element");
    const model1 = binder1.hydrate(cst1!) as ModelElement;
    const rootId = model1.id;

    // Simulate update: id="2"
    const input2 = '<root id="2">Text</root>';
    const binder2 = new XMLBinder(input2);
    const cst2 = parser.parse(input2, "element");
    
    // Reconcile model1 with cst2
    const newModel = binder2.reconcile(model1, cst2!);
    
    expect(newModel).toBe(model1); // Instance preserved
    expect(newModel.id).toBe(rootId);
    expect((newModel as ModelElement).attributes.get("id")).toBe("2"); // Attribute updated
  });

  it("should preserve child identity when sibling text changes", () => {
    const input1 = '<root><a>A</a><b>B</b></root>';
    const binder1 = new XMLBinder(input1);
    const cst1 = parser.parse(input1, "element");
    const model1 = binder1.hydrate(cst1!) as ModelElement;
    
    const childA = model1.children[0] as ModelElement;
    const childB = model1.children[1] as ModelElement;
    const childAId = childA.id;
    const childBId = childB.id;

    // Simulate update: <a>A</a> -> <a>Mod</a>
    const input2 = '<root><a>Mod</a><b>B</b></root>';
    const binder2 = new XMLBinder(input2);
    const cst2 = parser.parse(input2, "element");

    const newModel = binder2.reconcile(model1, cst2!) as ModelElement;

    expect(newModel).toBe(model1);
    
    // Child A should be preserved (element identity), but text child updated
    expect(newModel.children[0]).toBe(childA);
    expect(childA.id).toBe(childAId);
    expect((newModel.children[0] as ModelElement).children[0]).toBeInstanceOf(ModelText);
    expect(((newModel.children[0] as ModelElement).children[0] as ModelText).text).toBe("Mod");

    // Child B should be preserved untouched
    expect(newModel.children[1]).toBe(childB);
    expect(childB.id).toBe(childBId);
  });

  it("should replace node when tag name changes", () => {
    const input1 = '<root><old/></root>';
    const binder1 = new XMLBinder(input1);
    const cst1 = parser.parse(input1, "element");
    const model1 = binder1.hydrate(cst1!) as ModelElement;
    const oldNode = model1.children[0];

    const input2 = '<root><new/></root>';
    const binder2 = new XMLBinder(input2);
    const cst2 = parser.parse(input2, "element");

    const newModel = binder2.reconcile(model1, cst2!) as ModelElement;
    
    expect(newModel).toBe(model1);
    expect(newModel.children[0]).not.toBe(oldNode);
    expect((newModel.children[0] as ModelElement).tagName).toBe("new");
  });
});
