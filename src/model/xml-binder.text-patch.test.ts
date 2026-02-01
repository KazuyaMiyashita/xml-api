import { Parser } from "../cst/parser";
import { grammar } from "../cst/xml-grammar";
import type { ModelElement } from "./xml-api-model";
import { XMLBinder } from "./xml-binder";

describe("XMLBinder Text Update Patch", () => {
  const parser = new Parser(grammar);

  it("should update text content of regular element", () => {
    const input = "<root>Old Text</root>";
    const binder = new XMLBinder(input);
    const cst = parser.parse(input, "element");
    const model = binder.hydrate(cst!) as ModelElement;

    const patch = binder.calcUpdateTextPatch(model, "New Text");
    // <root> (0-6)
    // Old Text (6-14)
    // </root> (14-21)

    expect(patch).toEqual({
      start: 6,
      end: 14,
      text: "New Text",
    });
  });

  it("should expand EmptyElemTag to STag/ETag with text", () => {
    const input = "<item id='1'/>";
    const binder = new XMLBinder(input);
    const cst = parser.parse(input, "element");
    const model = binder.hydrate(cst!) as ModelElement;

    const patch = binder.calcUpdateTextPatch(model, "Value");
    // <item id='1'/>
    // Should become <item id='1'>Value</item>
    // Replace whole tag? Or just replace "/>" with ">Value</item>"?
    // Replacing "/>" is minimally invasive.

    // <item id='1'/>
    // 01234567890123
    // /> is at 12-14.

    expect(patch).toEqual({
      start: 12,
      end: 14,
      text: ">Value</item>",
    });
  });

  it("should handle mixed content replacement", () => {
    const input = "<root>A<b>B</b>C</root>";
    const binder = new XMLBinder(input);
    const cst = parser.parse(input, "element");
    const model = binder.hydrate(cst!) as ModelElement;

    const patch = binder.calcUpdateTextPatch(model, "All New");
    // <root> is 0-6.
    // content is 6-16 (A<b>B</b>C is 10 chars? A(1)+< (1)+b(1)+>(1)+B(1)+<(1)+/(1)+b(1)+>(1)+C(1) = 10? No.
    // <root>A<b>B</b>C</root>
    // 01234567890123456789012
    // 0: <root> (6 chars, ends at 6)
    // 6: A (1 char)
    // 7: <b>B</b> (3+1+4 = 8 chars?)
    //    <b> (3)
    //    B (1)
    //    </b> (4)
    //    Total: 3+1+4 = 8.
    // 7+8 = 15.
    // 15: C (1 char). Ends at 16.
    // 16: </root>
    // So content is 6-16.

    expect(patch).toEqual({
      start: 6,
      end: 16,
      text: "All New",
    });
  });
});
