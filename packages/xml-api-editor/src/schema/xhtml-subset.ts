import { Schema } from "prosemirror-model";

// Define the schema for the strict subset of XHTML5 we support
// Supported Elements:
// - section
// - h1, h2, h3, h4, h5, h6 (mapped to heading node with level attr)
// - p
// - br (hard_break)
// - strong/b (mark)

export const xhtmlSubsetSchema = new Schema({
  nodes: {
    // The document root must contain one or more blocks
    doc: { content: "block+" },

    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM() {
        return ["p", 0];
      },
    },

    heading: {
      attrs: { level: { default: 1 } },
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } },
        { tag: "h4", attrs: { level: 4 } },
        { tag: "h5", attrs: { level: 5 } },
        { tag: "h6", attrs: { level: 6 } },
      ],
      toDOM(node) {
        return ["h" + node.attrs.level, 0];
      },
    },

    section: {
      content: "block+",
      group: "block",
      parseDOM: [{ tag: "section" }],
      toDOM() {
        return ["section", { class: "wysiwyg-section" }, 0];
      },
    },

    text: { group: "inline" },

    hard_break: {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{ tag: "br" }],
      toDOM() {
        return ["br"];
      },
    },
  },

  marks: {
    strong: {
      parseDOM: [{ tag: "strong" }, { tag: "b" }],
      toDOM() {
        return ["strong", 0];
      },
    },
  },
});
