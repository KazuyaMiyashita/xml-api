import { XMLAPI } from "@/xml-api";

describe("XMLAPI Context-Aware Formatting", () => {
  it("should respect surrounding indentation when replacing a node with nested content", () => {
    // 4 spaces indentation
    const input = `<root>
    <parent>
        <child>Old</child>
    </parent>
</root>`;
    const api = new XMLAPI(input);
    const doc = api.getDocument();
    const child = doc.querySelector("child")!;

    // New content has structure
    const newChild = doc.createElement("child");
    const grandchild = doc.createElement("grandchild");
    grandchild.textContent = "Val";
    newChild.appendChild(grandchild);

    child.parentNode!.replaceChild(newChild, child);

    // The indentation should be preserved (4 spaces for child, 8 spaces for grandchild)
    const expected = `<root>
    <parent>
        <child>
            <grandchild>Val</grandchild>
        </child>
    </parent>
</root>`;

    expect(api.source).toBe(expected);
  });

  it("should respect tab indentation with nested content", () => {
    const input = `<root>
	<parent>
		<child>Old</child>
	</parent>
</root>`;
    const api = new XMLAPI(input);
    const doc = api.getDocument();
    const child = doc.querySelector("child")!;

    const newChild = doc.createElement("child");
    const grandchild = doc.createElement("grandchild");
    grandchild.textContent = "Val";
    newChild.appendChild(grandchild);

    child.parentNode!.replaceChild(newChild, child);

    const expected = `<root>
	<parent>
		<child>
			<grandchild>Val</grandchild>
		</child>
	</parent>
</root>`;

    expect(api.source).toBe(expected);
  });
});
