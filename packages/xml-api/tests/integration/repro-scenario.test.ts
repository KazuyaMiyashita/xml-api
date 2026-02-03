import { XMLAPI } from "../../src/xml-api";
import { Element } from "../../src/dom";

describe("Reproduction Scenario (v0.9.1)", () => {
  it("maintains sync after schema-view based edits (avoiding full reformat)", () => {
    const initial = `<root>\n  <item>A</item>\n</root>`;
    const api = new XMLAPI(initial);
    const view = api.createView(); // Default filter (all)
    
    const root = view.getRoot();
    
    // 1. Insert new item (should auto-indent)
    const newItem = view.getDocument().createElement("item");
    newItem.textContent = "B";
    root.appendChild(newItem);
    
    // Check intermediate state
    expect(api.source).toContain("<item>B</item>");
    
    // Verify CST linking
    const model = newItem.getModel();
    expect(model.cst).toBeDefined();
    const idBefore = model.id;
    
    // Check if api.model still has this node
    const rootModel = api.model!;
    const itemB = rootModel.children[rootModel.children.length - 1]; // Last child (ignoring whitespace text?)
    // Note: api.model might have text nodes (newlines)
    // Find the element B
    const elements = rootModel.children.filter(c => c.getType() === "Element");
    const lastElement = elements[elements.length - 1];
    
    // Check if ID matches
    // console.log("Old ID:", idBefore);
    // console.log("Current B ID:", lastElement.id);
    
    expect(lastElement.id).toBe(idBefore);
    expect(lastElement).toBe(model);
    
    // 2. Edit the new item
    newItem.setAttribute("status", "new");
    
    // Verify ID preserved (optional, but good for debugging)
    expect(newItem.getModel().id).toBe(idBefore);
    
    // Check final state
    expect(api.source).toContain('<item status="new">B</item>');
    
    // 3. Verify consistency
    // If sync was broken, model might be empty or invalid
    const items = api.getDocument().querySelectorAll("item");
    expect(items.length).toBe(2);
    expect((items.item(1) as Element).getAttribute("status")).toBe("new");
  });
});
