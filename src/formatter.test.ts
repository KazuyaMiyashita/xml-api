import { Formatter } from "./formatter";
import { AST } from "./xml-ast";

describe("Formatter", () => {
  const formatter = new Formatter({ indent: "  ", newline: "\n" });

  it("should format self-closing element", () => {
    const ast = new AST("root");
    expect(formatter.format(ast)).toBe("<root/>");
  });

  it("should format element with attributes", () => {
    const ast = new AST("root", { id: "1", class: "test" });
    expect(formatter.format(ast)).toBe('<root id="1" class="test"/>');
  });

  it("should format nested elements (block)", () => {
    const ast = new AST("root", {}, [
      new AST("child", {}, [new AST("grandchild")]),
    ]);
    const expected = 
`<root>
  <child>
    <grandchild/>
  </child>
</root>`;
    expect(formatter.format(ast)).toBe(expected);
  });

  it("should format mixed content as inline", () => {
    const ast = new AST("p", {}, [
      "Hello ",
      new AST("b", {}, ["World"]),
      "!",
    ]);
    const expected = `<p>Hello <b>World</b>!</p>`;
    expect(formatter.format(ast)).toBe(expected);
  });
  
  it("should escape special characters", () => {
      const ast = new AST("note", { title: 'quoted "text"' }, ["<content> & more"]);
      // Attribute: quoted "text" -> quoted &quot;text&quot;
      // Content: <content> & more -> &lt;content&gt; &amp; more
      const expected = `<note title="quoted &quot;text&quot;">&lt;content&gt; &amp; more</note>`;
      expect(formatter.format(ast)).toBe(expected);
  });
});

