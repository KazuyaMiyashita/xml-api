import { Parser } from "@/cst/parser";
import { grammar } from "@/cst/xml-grammar";
import type { ModelElement } from "@/model/xml-api-model";
import { XMLBinder } from "@/model/xml-binder";

describe("XMLBinder Patch Generation", () => {
  const parser = new Parser(grammar);

  it("should generate patch to update existing attribute", () => {
    const input = '<root id="1" />';
    const binder = new XMLBinder(input);
    const cst = parser.parse(input, "element");
    expect(cst).not.toBeNull();
    const model = binder.hydrate(cst!) as ModelElement;

    const patch = binder.calcSetAttributePatch(model, "id", "2");
    // <root id="1" />
    // 012345678901234
    // id="1"
    // AttValue is "1".

    // Check if patch replaces the whole AttValue or just content.
    // If implementation replaces AttValue, text should be '"2"'.
    // If original was "1", new is "2".
    // Expectation: replace including quotes.

    // "1" is at index 9. length 3.
    expect(patch).toEqual({
      start: 9,
      end: 12,
      text: '"2"',
    });
  });

  it("should generate patch to insert new attribute", () => {
    const input = "<root/>";
    const binder = new XMLBinder(input);
    const cst = parser.parse(input, "element");
    expect(cst).not.toBeNull();
    const model = binder.hydrate(cst!) as ModelElement;

    const patch = binder.calcSetAttributePatch(model, "id", "1");
    // <root/>
    // 0123456
    // <root (0-5)
    // /> (5-7)
    // Insert before /> at 5.

    expect(patch).toEqual({
      start: 5,
      end: 5,
      text: ' id="1"',
    });
  });

  it("should generate patch to insert new attribute in STag", () => {
    const input = "<root></root>";
    const binder = new XMLBinder(input);
    const cst = parser.parse(input, "element");
    const model = binder.hydrate(cst!) as ModelElement;

    const patch = binder.calcSetAttributePatch(model, "id", "1");
    // <root>
    // 012345
    // > is at 5.

    expect(patch).toEqual({
      start: 5,
      end: 5,
      text: ' id="1"',
    });
  });
});
