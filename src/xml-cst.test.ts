import { CST } from "./xml-cst";

describe("CST", () => {
  describe("getText", () => {
    it("should return the correct substring from input", () => {
      const input = "0123456789";
      const node = new CST("test", undefined, 2, 5); // "234"
      expect(node.getText(input)).toBe("234");
    });
  });

  describe("unwrap", () => {
    it("should return self if no children", () => {
      const node = new CST("leaf", undefined, 0, 5);
      expect(node.unwrap()).toBe(node);
    });

    it("should return self if multiple children", () => {
      const child1 = new CST("child1", undefined, 0, 2);
      const child2 = new CST("child2", undefined, 2, 5);
      const node = new CST("parent", undefined, 0, 5, [child1, child2]);
      expect(node.unwrap()).toBe(node);
    });

    it("should unwrap single child that matches parent range", () => {
      const child = new CST("child", undefined, 0, 5);
      const node = new CST("wrapper", undefined, 0, 5, [child]);
      expect(node.unwrap()).toBe(child);
    });

    it("should recursively unwrap nested single children", () => {
      const inner = new CST("inner", undefined, 0, 5);
      const middle = new CST("middle", undefined, 0, 5, [inner]);
      const outer = new CST("outer", undefined, 0, 5, [middle]);
      expect(outer.unwrap()).toBe(inner);
    });

    it("should NOT unwrap if child range differs", () => {
      const child = new CST("child", undefined, 1, 4);
      const node = new CST("wrapper", undefined, 0, 5, [child]);
      expect(node.unwrap()).toBe(node);
    });
  });

  describe("shift", () => {
    it("should shift start and end if node is after insertion point", () => {
      // Node at [10, 20), insert 5 chars at 5.
      const node = new CST("test", undefined, 10, 20);
      node.shift(5, 5);
      expect(node.start).toBe(15);
      expect(node.end).toBe(25);
    });

    it("should extend end if insertion is inside the node", () => {
      // Node at [10, 20), insert 5 chars at 15.
      const node = new CST("test", undefined, 10, 20);
      node.shift(15, 5);
      expect(node.start).toBe(10);
      expect(node.end).toBe(25);
    });

    it("should recursively shift children", () => {
      // Parent [0, 10), Child [5, 10). Insert 2 chars at 2.
      // Parent should become [0, 12), Child should become [7, 12).
      const child = new CST("child", undefined, 5, 10);
      const parent = new CST("parent", undefined, 0, 10, [child]);

      parent.shift(2, 2);

      expect(parent.start).toBe(0);
      expect(parent.end).toBe(12);
      expect(child.start).toBe(7);
      expect(child.end).toBe(12);
    });

    it("should not affect nodes before the insertion point", () => {
      // Node at [0, 5), insert at 10.
      const node = new CST("test", undefined, 0, 5);
      node.shift(10, 5);
      expect(node.start).toBe(0);
      expect(node.end).toBe(5);
    });
  });
});
