import { AST } from "@/ast/xml-ast";

describe("AST", () => {
  it("should create an element with attributes and children", () => {
    const child = new AST("child", {}, ["text"]);
    const el = new AST("root", { id: "1" }, [child]);

    expect(el.tagName).toBe("root");
    expect(el.attr("id")).toBe("1");
    expect(el.children.length).toBe(1);
    expect(el.children[0]).toBeInstanceOf(AST);
  });

  it("text() should return concatenated text content", () => {
    const el = new AST("p", {}, ["Hello, ", new AST("b", {}, ["World"]), "!"]);
    expect(el.text()).toBe("Hello, World!");
  });

  it("find() should find descendant elements", () => {
    const target = new AST("target", {}, []);
    const root = new AST("root", {}, [
      new AST("wrapper", {}, [target]),
      new AST("other", {}, []),
    ]);

    const results = root.find("target");
    expect(results.length).toBe(1);
    expect(results[0]).toBe(target);
  });
});
