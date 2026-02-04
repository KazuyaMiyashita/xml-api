import { Parser } from "@/cst/parser";
import { grammar } from "@/cst/xml-grammar";
import type { ModelElement } from "@/model/xml-api-model";
import { XMLBinder } from "@/model/xml-binder";

describe("XMLBinder Node Replacement Patch", () => {
  const parser = new Parser(grammar);

  it("should replace element with new XML string", () => {
    const input = "<root><old>content</old></root>";
    const binder = new XMLBinder(input);
    const cst = parser.parse(input, "element");
    if (!cst) throw new Error("Parse failed");
    const model = binder.hydrate(cst) as ModelElement;

    // Find <old> child
    const oldNode = model.children[0] as ModelElement;

    const patch = binder.calcReplaceNodePatch(oldNode, "<new/>");
    // <root> (0-6)
    // <old>content</old> (6-24)

    expect(patch).toEqual({
      start: 6,
      end: 24,
      text: "<new/>",
    });
  });
});
