import type {
  Element as ApiElement,
  Node as ApiNode,
  ModelElement,
  ModelNode,
  XMLAPI,
} from "@miy2/xml-api";
import type { ViewChangeEvent } from "@miy2/xml-api/view/schema-view";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import {
  DOMSerializer,
  DOMParser as PMDOMParser,
  type Node as PMNode,
  Fragment,
} from "prosemirror-model";
import { EditorState, type Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { idPlugin, idPluginKey } from "../plugins/id-plugin";
import { xhtmlSubsetSchema } from "../schema/xhtml-subset";
import "./WYSIWYGEditor.css";

interface WYSIWYGEditorProps {
  api: XMLAPI;
}

// --- Helpers ---

// Convert xml-api view DOM to PM DOM (browser nodes)
const viewToBrowserDOM = (viewNode: ApiNode): Node | null => {
  if (viewNode.nodeType === 3) {
    return document.createTextNode(viewNode.textContent || "");
  }
  if (viewNode.nodeType === 1) {
    const el = viewNode as ApiElement;
    if (el.tagName === "html" || el.tagName === "body") {
      const fragment = document.createDocumentFragment();
      const children = el.childNodes;
      for (let i = 0; i < children.length; i++) {
        const item = children.item(i);
        if (item) {
          const child = viewToBrowserDOM(item);
          if (child) fragment.appendChild(child);
        }
      }
      return fragment;
    }
    const dom = document.createElement(el.tagName);
    const model = el.getModel() as ModelElement;
    if (model.id) {
      dom.setAttribute("data-model-id", model.id);
    }
    model.attributes.forEach((v: string, k: string) => {
      dom.setAttribute(k, v);
    });
    const children = el.childNodes;
    for (let i = 0; i < children.length; i++) {
      const item = children.item(i);
      if (item) {
        const child = viewToBrowserDOM(item);
        if (child) dom.appendChild(child);
      }
    }
    return dom;
  }
  return null;
};

// Parse a browser DOM node into a ProseMirror node/fragment using the schema
const parseBrowserDOM = (dom: Node): PMNode | Fragment | null => {
  let parseTarget: Node = dom;
  if (parseTarget.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    const div = document.createElement("div");
    div.appendChild(parseTarget);
    parseTarget = div;
  }

  // If it's a text node, wrap in div to parse? Or just text?
  // PMDOMParser.parse expects an element.
  if (parseTarget.nodeType === Node.TEXT_NODE) {
    // This case is rare for structure updates, but possible for text updates.
    // However, text updates are usually handled specifically.
    // For general parsing:
    const div = document.createElement("div");
    div.appendChild(parseTarget);
    return PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(div).content;
  }

  return PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(parseTarget);
};

// --- Hooks ---

// Hook for Sync: ProseMirror -> XML (Dispatcher)
const useDispatcher = (api: XMLAPI, schemaView: any) => {
  const syncToXml = useCallback(
    (tr: Transaction, _oldState: EditorState, newState: EditorState) => {
      if (!api.cst || !api.cst.wellFormed || !schemaView) return;

      // Check if this transaction originated from external (XML) change
      if (tr.getMeta("origin") === "external") return;

      // 1. Attribute Changes (Optimization)
      // TODO: Track attribute changes specifically if needed.
      // Currently, PM doesn't easily give "attribute changed" diffs without step analysis.

      // 2. Structural/Text Changes
      // We try to find the smallest common ancestor that covers the changes.
      // Or, simply iterate over changed ranges.

      // Simple Strategy for now:
      // If the document changed, we identify the modified block and sync it.
      // If the root changed significantly, sync root.

      // For this prototype, we'll try to sync the immediate parent of the selection
      // or the modified node.

      // Let's use a slightly more robust approach:
      // Iterate steps to find modified ranges?
      // Or just look at `tr.docChanged`.

      if (!tr.docChanged) return;

      // Full document sync is safe but slow.
      // Partial sync requires mapping PM node -> Model ID -> SchemaView Node.

      // Let's try to sync the node that contains the change.
      // For text edits, it's usually the paragraph.
      // We look for the deepest node that has a model-id.

      let targetPmNode: PMNode | null = null;
      // const targetPos: number | null = null;

      // Heuristic: Use the selection anchor to find the parent block.
      // This works for cursor-based edits.
      const $pos = newState.selection.$anchor;
      for (let d = $pos.depth; d >= 0; d--) {
        const node = $pos.node(d);
        if (node.attrs.modelId) {
          targetPmNode = node;
          break;
        }
      }

      // If we couldn't find a localized target (e.g. at root doc level), sync root.
      if (!targetPmNode) {
        targetPmNode = newState.doc;
      }

      // Now we have a target PM node to sync.
      // We need to serialize IT (and its children) to a DOM Fragment.
      const serializer = DOMSerializer.fromSchema(xhtmlSubsetSchema);
      let externalNode: Node;

      if (targetPmNode.type.name === "doc") {
        // Special case for doc: We want to sync content to body or html
        const contentFragment = serializer.serializeFragment(
          targetPmNode.content,
        );
        const wrapper = document.createElement("div");
        wrapper.appendChild(contentFragment);
        externalNode = wrapper;
      } else {
        try {
          externalNode = serializer.serializeNode(targetPmNode);
        } catch (e) {
          console.error("Serialization failed for node:", targetPmNode.type.name, e);
          // Fallback to full doc sync
          const contentFragment = serializer.serializeFragment(
            newState.doc.content,
          );
          const wrapper = document.createElement("div");
          wrapper.appendChild(contentFragment);
          externalNode = wrapper;
          targetPmNode = newState.doc;
        }
      }

      // Find the corresponding SchemaView node
      let targetViewNode: ApiNode | null = null;
      const modelId = targetPmNode.attrs.modelId;

      if (modelId) {
        targetViewNode = schemaView.getNodeByModelId(modelId);
      } else {
        // Fallback to root if no ID (should be root doc)
        targetViewNode = schemaView.getRoot();
      }

      if (targetViewNode && targetViewNode.nodeType === 1) {
        // Reconcile this specific node
        // If targetPmNode was doc, externalNode is div[content], targetViewNode might be body/html.
        // Reconcile body children with div children.
        
        let body = targetViewNode as ApiElement;
        if (targetPmNode.type.name === "doc") {
            const root = schemaView.getRoot();
            body = root;
            if (root.tagName === "html") {
              const found = root.querySelector("body");
              if (found) body = found;
            }
        }

        schemaView.reconcile(
          externalNode,
          { origin: "wysiwyg-editor" },
          body,
        );
      } else {
        // Fallback: Full Sync if mapping fails
        const root = schemaView.getRoot();
        let body = root;
        if (root.tagName === "html") {
          const found = root.querySelector("body");
          if (found) body = found;
        }
        const fragment = serializer.serializeFragment(newState.doc.content);
        // Wrapper for body
        const wrapper = document.createElement("body");
        wrapper.appendChild(fragment);

        schemaView.reconcile(wrapper, { origin: "wysiwyg-editor" }, body);
      }
    },
    [api, schemaView],
  );

  return syncToXml;
};

// Hook for Reflection: XML -> ProseMirror (Reflector)
const useReflector = (
  schemaView: any,
  viewRef: React.MutableRefObject<EditorView | null>,
  isWellFormed: boolean,
) => {
  useEffect(() => {
    if (!schemaView) return;

    return schemaView.on((event: ViewChangeEvent) => {
      if (event.transaction?.getMeta("origin") === "wysiwyg-editor") {
        return;
      }
      if (!isWellFormed || !viewRef.current) return;

      const view = viewRef.current;
      const state = view.state;

      // Handle Structure/Attribute/Text Changes
      if (
        event.type === "structure" ||
        event.type === "attribute" ||
        event.type === "text"
      ) {
        const targetViewNode = event.target;
        if (
          targetViewNode.nodeType === 1 &&
          (targetViewNode as ApiElement).getModel()
        ) {
          const modelId = (targetViewNode as ApiElement).getModel().id;

          // Find the node in PM doc
          let targetPos: number | null = null;
          let targetNode: PMNode | null = null;

          if (modelId === schemaView.getRoot().getModel().id) {
            targetPos = 0;
            targetNode = state.doc;
          } else {
            // Optimization: Use ID Plugin to find position O(1)
            const idMap = idPluginKey.getState(state);
            const pos = idMap?.get(modelId);
            
            if (pos !== undefined) {
              const node = state.doc.nodeAt(pos);
              if (node && node.attrs.modelId === modelId) {
                targetPos = pos;
                targetNode = node;
              }
            }

            // Fallback (if plugin fails or inconsistent): O(N) search
            if (targetPos === null) {
              state.doc.descendants((node, pos) => {
                if (node.attrs.modelId === modelId) {
                  targetPos = pos;
                  targetNode = node;
                  return false;
                }
                return true;
              });
            }
          }

          if (targetNode && targetPos !== null) {
            const browserDom = viewToBrowserDOM(targetViewNode);
            if (browserDom) {
              let newPmContent: PMNode | Fragment | null = null;

              if (targetNode.type.name === "doc") {
                // Doc update (root)
                const parsed = parseBrowserDOM(browserDom);
                if (parsed instanceof Fragment) {
                  // Should not happen if parseBrowserDOM returns Node for Element
                  // but if we passed a Fragment...
                  // viewToBrowserDOM for root returns a Fragment usually?
                  // No, for Element it returns Element.
                  // For 'html'/'body' it returns Fragment in current impl.
                }
                // If it's doc, we expect content fragment.
                // Our viewToBrowserDOM returns Fragment for body/html.
                if (browserDom.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                  // Parse fragment content?
                  // PMDOMParser.parseSlice?
                  // Easier: wrap in div and parse
                  const div = document.createElement("div");
                  div.appendChild(browserDom.cloneNode(true));
                  newPmContent = PMDOMParser.fromSchema(
                    xhtmlSubsetSchema,
                  ).parse(div);
                }
              } else {
                // Element update
                // browserDom is the element itself (<p>...</p>)
                // We want to replace targetNode with this new element.
                // PMDOMParser.parse(dom) returns a Doc containing the node?
                // Or if we parse with context?
                const div = document.createElement("div");
                div.appendChild(browserDom);
                const doc = PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(
                  div,
                );
                newPmContent = doc.firstChild;
              }

              if (newPmContent) {
                const tr = state.tr;
                tr.replaceWith(
                  targetPos,
                  targetPos + targetNode.nodeSize,
                  newPmContent,
                );
                tr.setMeta("origin", "external");

                // Attempt to preserve selection
                // Simple case: if selection was inside this node, map it?
                // replaceWith usually maps position, but content is replaced.
                // If the user was typing in this node, cursor might jump to start/end.
                // Future improvement: Diff the content and apply granular updates.

                view.dispatch(tr);
                return; // Handled
              }
            }
          }
        }
      }

      // Fallback: Full Update
      const root = schemaView.getRoot();
      const browserDom = viewToBrowserDOM(root);
      if (browserDom) {
        let parseTarget: Node = browserDom;
        if (parseTarget.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
          const div = document.createElement("div");
          div.appendChild(parseTarget);
          parseTarget = div;
        }
        const newPmDoc =
          PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(parseTarget);

        if (!newPmDoc.eq(state.doc)) {
          const fixTr = state.tr.replaceWith(
            0,
            state.doc.content.size,
            newPmDoc,
          );
          fixTr.setMeta("origin", "external");
          view.dispatch(fixTr);
        }
      }
    });
  }, [schemaView, isWellFormed, viewRef]);
};

// --- Component ---

const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({ api }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInitializing = useRef(false);
  const [isWellFormed, setIsWellFormed] = useState(
    api.cst?.wellFormed ?? false,
  );

  useEffect(() => {
    return api.on((_event) => {
      const wellFormed = api.cst
        ? api.cst.wellFormed
        : api.source.trim() === "";
      setIsWellFormed(wellFormed);
    });
  }, [api]);

  // Create SchemaView
  const schemaView = useMemo(() => {
    try {
      return api.createView({
        filter: (node: ModelNode) => {
          if (node.getType() === "Element") {
            const tagName = (node as ModelElement).tagName;
            return [
              "html",
              "body",
              "p",
              "strong",
              "em",
              "div",
              "span",
              "h1",
              "h2",
              "h3",
              "section",
            ].includes(tagName);
          }
          if (node.getType() === "Text") return true;
          return false;
        },
      });
    } catch (_e) {
      return null;
    }
  }, [api]);

  const dispatchToXml = useDispatcher(api, schemaView);
  useReflector(schemaView, viewRef, isWellFormed);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Init logic
  useEffect(() => {
    if (!editorRef.current || !schemaView) return;

    const initEditor = () => {
      // Initial Load
      const root = schemaView.getRoot();
      const browserDom = viewToBrowserDOM(root);
      let initialDoc: PMNode;

      if (browserDom) {
        let parseTarget: Node = browserDom;
        if (parseTarget.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
          const div = document.createElement("div");
          div.appendChild(parseTarget);
          parseTarget = div;
        }
        initialDoc =
          PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(parseTarget);
      } else {
        initialDoc = xhtmlSubsetSchema.node("doc", null, [
          xhtmlSubsetSchema.node("paragraph", null, [
            xhtmlSubsetSchema.text("Loading..."),
          ]),
        ]);
      }

      const state = EditorState.create({
        doc: initialDoc,
        schema: xhtmlSubsetSchema,
        plugins: [
          idPlugin,
          keymap({
            "Mod-b": toggleMark(xhtmlSubsetSchema.marks.strong),
            ...baseKeymap,
          }),
        ],
      });

      const view = new EditorView(editorRef.current, {
        state,
        dispatchTransaction(tr: Transaction) {
          const newState = view.state.apply(tr);
          view.updateState(newState);
          if (tr.docChanged && !tr.getMeta("origin")) {
            // Only sync if local change
            try {
              dispatchToXml(tr, view.state, newState);
            } catch (e) {
              console.error("Sync to XML API failed:", e);
            }
          }
        },
      });

      viewRef.current = view;
      isInitializing.current = true;
    };

    initEditor();

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [schemaView, isWellFormed]); // Re-init if schema/validity changes drastically

  if (!isWellFormed && api.source.trim() !== "") {
    return (
      <div className="wysiwyg-container">
        <div className="editor-error">Invalid XML</div>
      </div>
    );
  }

  if (!schemaView) {
    return (
      <div className="wysiwyg-container">
        <div className="editor-error">Invalid XML (Model Error)</div>
      </div>
    );
  }

  return (
    <div className="wysiwyg-container">
      <div className="wysiwyg-toolbar">
        <button
          type="button"
          onClick={() => {
            if (viewRef.current) {
              toggleMark(xhtmlSubsetSchema.marks.strong)(
                viewRef.current.state,
                viewRef.current.dispatch,
              );
              viewRef.current.focus();
            }
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          Bold
        </button>
      </div>
      <div className="wysiwyg-editor prose-mirror-wrapper" ref={editorRef} />
    </div>
  );
};

export default WYSIWYGEditor;
