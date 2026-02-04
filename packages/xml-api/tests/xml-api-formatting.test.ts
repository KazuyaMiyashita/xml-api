import { ModelElement, type ModelNode, ModelText } from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";

function h(
  tagName: string,
  attrs: { [key: string]: string } = {},
  children: (ModelNode | string)[] = [],
): ModelElement {
  const el = new ModelElement(tagName);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === "string") {
      el.addChild(new ModelText(child));
    } else {
      el.addChild(child);
    }
  }
  return el;
}

describe("XMLAPI Context-Aware Formatting", () => {
  it("should respect surrounding indentation when replacing a node with nested content", () => {
    // 4 spaces indentation
    const input = `<root>
    <parent>
        <child>Old</child>
    </parent>
</root>`;
    const api = new XMLAPI(input);
    const child = api.model!.find("child")[0]!;

    // New content has structure
    const newContent = h("child", {}, [h("grandchild", {}, ["Val"])]);

    api.replaceNode(child, newContent);

    // The indentation should be preserved (4 spaces for child, 8 spaces for grandchild)
    const expected = `<root>
    <parent>
        <child>
            <grandchild>Val</grandchild>
        </child>
    </parent>
</root>`;

    expect(api.input).toBe(expected);
  });

  it("should respect tab indentation with nested content", () => {
    const input = `<root>
	<parent>
		<child>Old</child>
	</parent>
</root>`;
    const api = new XMLAPI(input);
    const child = api.model!.find("child")[0]!;

    const newContent = h("child", {}, [h("grandchild", {}, ["Val"])]);

    api.replaceNode(child, newContent);

    const expected = `<root>
	<parent>
		<child>
			<grandchild>Val</grandchild>
		</child>
	</parent>
</root>`;

    expect(api.input).toBe(expected);
  });
});
