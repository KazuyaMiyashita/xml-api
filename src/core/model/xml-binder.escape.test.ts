import { XMLBinder } from "./xml-binder";
import { Parser } from "../cst/parser";
import { grammar } from "../cst/xml-grammar";
import { ModelElement } from "./xml-api-model";

describe("XMLBinder Escape Logic", () => {
  const parser = new Parser(grammar);

  it("should escape special characters in text updates", () => {
    const input = "<root>Old</root>";
    const binder = new XMLBinder(input);
    const cst = parser.parse(input, "element");
    const model = binder.hydrate(cst!) as ModelElement;

    // Text containing <, >, &
    const rawText = "1 < 2 & 3 > 0";
    const expectedEncoded = "1 &lt; 2 &amp; 3 &gt; 0";

    const patch = binder.calcUpdateTextPatch(model, rawText);

    expect(patch).toEqual({
      start: 6,
      end: 9,
      text: expectedEncoded,
    });
  });

  it("should escape special characters in attribute updates", () => {
    const input = '<root id="old"></root>';
    const binder = new XMLBinder(input);
    const cst = parser.parse(input, "element");
    const model = binder.hydrate(cst!) as ModelElement;

    const rawValue = 'A "B" & C';
    // Ideally: "A &quot;B&quot; &amp; C"
    // But depending on the implementation, " might not be escaped if the attribute is quoted with '.
    // Here we assume standard double quotes behavior for now, or robust escape.
    
    // The binder uses the existing quote if present. Here it is double quote.
    const expectedValue = 'A &quot;B&quot; &amp; C';
    
    const patch = binder.calcSetAttributePatch(model, "id", rawValue);
    
    // calcSetAttributePatch returns the quoted string if it finds the attribute?
    // Let's check the implementation.
    // It returns { start, end, text: `${newQuote}${value}${newQuote}` }
    
    expect(patch?.text).toBe(`"${expectedValue}"`);
  });
  
  it("should handle attribute creation with proper escaping", () => {
      const input = '<root></root>';
      const binder = new XMLBinder(input);
      const cst = parser.parse(input, "element");
      const model = binder.hydrate(cst!) as ModelElement;

      const rawValue = "New < & > Value";
      // Attribute values must escape <, &, "
      // > is valid in attribute values but often escaped for consistency, though not strictly required.
      // < is strictly required? XML spec says < in AttValue is illegal.
      // & is strictly required.
      
      const expectedValue = 'New &lt; &amp; &gt; Value'; 
      
      const patch = binder.calcSetAttributePatch(model, "newAttr", rawValue);
      
      // Patch for new attribute is ` key="value"`
      expect(patch?.text).toBe(` newAttr="${expectedValue}"`);
  });
});
