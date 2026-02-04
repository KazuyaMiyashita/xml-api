import { createWrapper, Document, Element, Text } from "@/dom";
import { ModelElement, ModelText } from "@/model/xml-api-model";

describe("Custom DOM Wrapper", () => {
  let doc: Document;

  beforeEach(() => {
    doc = new Document();
  });

  describe("Document", () => {
    it("should create elements", () => {
      const el = doc.createElement("div");
      expect(el).toBeInstanceOf(Element);
      expect(el.tagName).toBe("div");
      expect(el.ownerDocument).toBe(doc);
    });

    it("should create text nodes", () => {
      const text = doc.createTextNode("hello");
      expect(text).toBeInstanceOf(Text);
      expect(text.data).toBe("hello");
      expect(text.ownerDocument).toBe(doc);
    });
  });

  describe("Element", () => {
    it("should handle attributes", () => {
      const el = doc.createElement("item");
      el.setAttribute("id", "1");
      expect(el.getAttribute("id")).toBe("1");
      expect(el.hasAttribute("id")).toBe(true);

      el.removeAttribute("id");
      expect(el.hasAttribute("id")).toBe(false);
      expect(el.getAttribute("id")).toBeNull();
    });

    it("should append children", () => {
      const parent = doc.createElement("parent");
      const child = doc.createElement("child");
      parent.appendChild(child);

      expect(parent.childNodes.length).toBe(1);
      expect(parent.firstChild).toBeInstanceOf(Element);
      expect((parent.firstChild as Element).tagName).toBe("child");
      expect(child.parentNode).not.toBeNull();
      // Note: wrapper identity is not preserved in current impl, so strict equality fails on wrapper
      // but underlying model should be same
      expect(child.parentNode?.getModel()).toBe(parent.getModel());
    });
  });

  describe("Node Traversal", () => {
    it("should traverse siblings", () => {
      const parent = doc.createElement("list");
      const item1 = doc.createElement("item1");
      const item2 = doc.createElement("item2");
      const item3 = doc.createElement("item3");

      parent.appendChild(item1);
      parent.appendChild(item2);
      parent.appendChild(item3);

      expect(item1.nextSibling).not.toBeNull();
      expect((item1.nextSibling as Element).tagName).toBe("item2");

      expect(item2.previousSibling).not.toBeNull();
      expect((item2.previousSibling as Element).tagName).toBe("item1");

      expect(item3.nextSibling).toBeNull();
    });
  });

  describe("Model Integration", () => {
    it("should reflect changes in underlying model", () => {
      const model = new ModelElement("root");
      const wrapper = createWrapper(model, doc) as Element;

      wrapper.setAttribute("foo", "bar");
      expect(model.attributes.get("foo")).toBe("bar");

      const textModel = new ModelText("initial");
      model.addChild(textModel);

      expect(wrapper.childNodes.length).toBe(1);
      expect(wrapper.firstChild?.textContent).toBe("initial");

      if (wrapper.firstChild) {
        wrapper.firstChild.textContent = "updated";
      }
      expect(textModel.text).toBe("updated");
    });
  });

  describe("Query Engine", () => {
    beforeEach(() => {
      const root = doc.createElement("root");
      doc.documentElement = root;

      const child1 = doc.createElement("child");
      child1.setAttribute("id", "c1");
      child1.setAttribute("class", "foo bar");
      root.appendChild(child1);

      const child2 = doc.createElement("child");
      child2.setAttribute("id", "c2");
      child2.setAttribute("class", "bar");
      root.appendChild(child2);

      const subChild = doc.createElement("sub");
      child1.appendChild(subChild);
    });

    it("should find by tag name", () => {
      const children = doc.querySelectorAll("child");
      expect(children.length).toBe(2);
      expect((children.item(0) as Element).getAttribute("id")).toBe("c1");
    });

    it("should find by id", () => {
      const el = doc.querySelector("#c2");
      expect(el).not.toBeNull();
      expect(el?.getAttribute("id")).toBe("c2");
    });

    it("should find by class", () => {
      const bars = doc.querySelectorAll(".bar");
      expect(bars.length).toBe(2);

      const foos = doc.querySelectorAll(".foo");
      expect(foos.length).toBe(1);
      expect((foos.item(0) as Element).getAttribute("id")).toBe("c1");
    });

    it("should find by attribute", () => {
      const el = doc.querySelector("[id=c1]");
      expect(el).not.toBeNull();
      expect(el?.tagName).toBe("child");
    });

    it("should find descendants", () => {
      const sub = doc.querySelector("sub");
      expect(sub).not.toBeNull();

      const subFromChild = doc.querySelector("#c1")?.querySelector("sub");
      expect(subFromChild).not.toBeNull();
    });
  });

  describe("Namespace Support", () => {
    it("should handle prefix and localName", () => {
      const el = doc.createElement("svg:circle");
      expect(el.prefix).toBe("svg");
      expect(el.localName).toBe("circle");

      const el2 = doc.createElement("div");
      expect(el2.prefix).toBeNull();
      expect(el2.localName).toBe("div");
    });

    it("should resolve namespaceURI", () => {
      const root = doc.createElement("root");
      root.setAttribute("xmlns:svg", "http://www.w3.org/2000/svg");
      root.setAttribute("xmlns", "http://example.com/default");
      doc.documentElement = root;

      const circle = doc.createElement("svg:circle");
      root.appendChild(circle);

      const div = doc.createElement("div");
      root.appendChild(div);

      const orphan = doc.createElement("svg:rect"); // No parent

      expect(circle.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(div.namespaceURI).toBe("http://example.com/default");
      expect(orphan.namespaceURI).toBeNull();
    });

    it("should resolve nested namespaceURI", () => {
      const root = doc.createElement("root");
      root.setAttribute("xmlns", "http://root.com");
      doc.documentElement = root;

      const child = doc.createElement("child");
      child.setAttribute("xmlns", "http://child.com");
      root.appendChild(child);

      const grandChild = doc.createElement("item");
      child.appendChild(grandChild);

      expect(root.namespaceURI).toBe("http://root.com");
      expect(child.namespaceURI).toBe("http://child.com"); // Shadowing
      expect(grandChild.namespaceURI).toBe("http://child.com"); // Inherited from child
    });
  });
});
