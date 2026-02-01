import {
  ModelElement,
  ModelText,
  ModelComment,
  ModelCDATA,
  type ModelNode,
} from "@/model/xml-api-model";
import { XMLAPI } from "@/xml-api";
import { Formatter } from "@/model/formatter";

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

describe("Formatter", () => {
  const formatter = new Formatter({ indent: "  ", newline: "\n" });

  it("should format self-closing element", () => {
    const ast = h("root");
    expect(formatter.format(ast)).toBe("<root />");
  });

  it("should format element with attributes", () => {
    const ast = h("root", { id: "1", class: "test" });
    expect(formatter.format(ast)).toBe('<root id="1" class="test" />');
  });

  it("should format nested elements (block)", () => {
    const ast = h("root", {}, [h("child", {}, [h("grandchild")])]);
    const expected = `<root>
  <child>
    <grandchild />
  </child>
</root>`;
    expect(formatter.format(ast)).toBe(expected);
  });

  it("should format mixed content as inline", () => {
    const ast = h("p", {}, ["Hello ", h("b", {}, ["World"]), "!"]);
    const expected = `<p>Hello <b>World</b>!</p>`;
    expect(formatter.format(ast)).toBe(expected);
  });

  it("should escape special characters", () => {
    const ast = h("note", { title: 'quoted "text"' }, ["<content> & more"]);
    // Attribute: quoted "text" -> quoted &quot;text&quot;
    // Content: <content> & more -> &lt;content&gt; &amp; more
    const expected = `<note title="quoted &quot;text&quot;">&lt;content&gt; &amp; more</note>`;
    expect(formatter.format(ast)).toBe(expected);
  });

  it("should support comments", () => {
    const ast = h("root", {}, [
      new ModelComment(" This is a comment "),
      h("child"),
    ]);
    const expected = `<root>\n  <!-- This is a comment -->\n  <child />\n</root>`;
    expect(formatter.format(ast)).toBe(expected);
  });

  it("should re-format existing indentation when force is true", () => {
    const original = `<root>\n  <child>\n    <content />\n  </child>\n</root>`;
    const api = new XMLAPI(original);

    const formatter4 = new Formatter({ indent: "    ", force: true });
    // api.model is the root element
    const output = formatter4.format(api.model!);

    expect(output).toContain("\n    <child>");
    expect(output).toContain("\n        <content />");
  });

  it("should change newline style when force is true", () => {
    const original = `<root>\n  <child />\n</root>`;
    const api = new XMLAPI(original);
    const formatterCRLF = new Formatter({ newline: "\r\n", force: true });
    const output = formatterCRLF.format(api.model!);
    expect(output).toContain("\r\n");
  });
});
