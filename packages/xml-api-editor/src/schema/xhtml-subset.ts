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
      attrs: { modelId: { default: null } },
      parseDOM: [
        {
          tag: "p",
          getAttrs: (dom) => ({
            modelId: (dom as HTMLElement).getAttribute("data-model-id"),
          }),
        },
      ],
      toDOM(node) {
        if (node.attrs.modelId) {
          return ["p", { "data-model-id": node.attrs.modelId }, 0];
        }
        return ["p", 0];
      },
    },

    heading: {
      attrs: { level: { default: 1 }, modelId: { default: null } },
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [
        {
          tag: "h1",
          getAttrs: (dom) => ({
            level: 1,
            modelId: (dom as HTMLElement).getAttribute("data-model-id"),
          }),
        },
        {
          tag: "h2",
          getAttrs: (dom) => ({
            level: 2,
            modelId: (dom as HTMLElement).getAttribute("data-model-id"),
          }),
        },
        {
          tag: "h3",
          getAttrs: (dom) => ({
            level: 3,
            modelId: (dom as HTMLElement).getAttribute("data-model-id"),
          }),
        },
        {
          tag: "h4",
          getAttrs: (dom) => ({
            level: 4,
            modelId: (dom as HTMLElement).getAttribute("data-model-id"),
          }),
        },
        {
          tag: "h5",
          getAttrs: (dom) => ({
            level: 5,
            modelId: (dom as HTMLElement).getAttribute("data-model-id"),
          }),
        },
        {
          tag: "h6",
          getAttrs: (dom) => ({
            level: 6,
            modelId: (dom as HTMLElement).getAttribute("data-model-id"),
          }),
        },
      ],
      toDOM(node) {
        const attrs: Record<string, string | number> = {};
        if (node.attrs.modelId) {
          attrs["data-model-id"] = node.attrs.modelId;
        }
        return [`h${node.attrs.level}`, attrs, 0];
      },
    },

    section: {
      content: "block+",
      group: "block",
      attrs: { modelId: { default: null } },
      parseDOM: [
        {
          tag: "section",
          getAttrs: (dom) => ({
            modelId: (dom as HTMLElement).getAttribute("data-model-id"),
          }),
        },
      ],
      toDOM(node) {
        if (node.attrs.modelId) {
          return ["section", { "data-model-id": node.attrs.modelId }, 0];
        }
        return ["section", 0];
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
