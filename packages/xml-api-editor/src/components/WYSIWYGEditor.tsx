import type {
  Element as ApiElement,
  Node as ApiNode,
  ModelElement,
  ModelNode,
  XMLAPI,
} from "@miy2/xml-api";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import {
  DOMSerializer,
  DOMParser as PMDOMParser,
  type Node as PMNode,
} from "prosemirror-model";
import { EditorState, type Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { xhtmlSubsetSchema } from "../schema/xhtml-subset";
import "./WYSIWYGEditor.css";

interface WYSIWYGEditorProps {
  api: XMLAPI;
  onExternalChange?: () => void;
}

// Helper to convert xml-api view DOM to PM DOM (browser nodes)
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

const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({
  api,
  onExternalChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInitializing = useRef(false);
  const [isWellFormed, setIsWellFormed] = useState(
    api.cst ? api.cst.wellFormed : api.source.trim() === "",
  );

  useEffect(() => {
    // Listen for model changes to update well-formed status
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
          // Simple filter for XHTML subset
          if (node.getType() === "Element") {
            const tagName = (node as ModelElement).tagName;
            // Allow basic tags
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

  // Sync ProseMirror state TO SchemaView (XML)
  const syncToXml = useCallback(
    (pmDoc: PMNode) => {
      if (!api.cst || !api.cst.wellFormed || !schemaView) return;
      const root = schemaView.getRoot();
      let body = root;
      if (root.tagName === "html") {
        const found = root.querySelector("body");
        if (found) body = found;
      }
      const serializer = DOMSerializer.fromSchema(xhtmlSubsetSchema);
      const fragment = serializer.serializeFragment(pmDoc.content);
      schemaView.reconcile(
        fragment as unknown as Node,
        { origin: "wysiwyg-editor" },
        body,
      );
    },
    [api, schemaView],
  );

  useEffect(() => {
    if (!editorRef.current || !schemaView) return;

    const updateInitialState = () => {
      if (viewRef.current && schemaView) {
        const root = schemaView.getRoot();
        const browserDom = viewToBrowserDOM(root);
        if (!browserDom) return;
        let parseTarget: Node = browserDom;
        if (parseTarget.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
          const div = document.createElement("div");
          div.appendChild(parseTarget);
          parseTarget = div;
        }
        const pmDoc =
          PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(parseTarget);
        const tr = viewRef.current.state.tr.replaceWith(
          0,
          viewRef.current.state.doc.content.size,
          pmDoc,
        );
        viewRef.current.dispatch(tr);
      }
    };

    const state = EditorState.create({
      doc: xhtmlSubsetSchema.node("doc", null, [
        xhtmlSubsetSchema.node("paragraph", null, [
          xhtmlSubsetSchema.text("Loading..."),
        ]),
      ]),
      schema: xhtmlSubsetSchema,
      plugins: [
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
        if (tr.docChanged && !isInitializing.current) {
          try {
            syncToXml(newState.doc);
            if (onExternalChange) onExternalChange();
          } catch (e) {
            console.error("Sync to XML API failed:", e);
          }
        }
      },
    });

    viewRef.current = view;
    isInitializing.current = true;
    updateInitialState();
    setTimeout(() => {
      isInitializing.current = false;
    }, 0);
    return () => {
      view.destroy();
    };
  }, [schemaView, onExternalChange, syncToXml]);

  useEffect(() => {
    if (!schemaView) return;
    return schemaView.on(
      (event: { transaction?: { getMeta: (key: string) => unknown } }) => {
        if (event.transaction?.getMeta("origin") === "wysiwyg-editor") {
          return;
        }
        if (viewRef.current && schemaView) {
          isInitializing.current = true;
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
            if (!newPmDoc.eq(viewRef.current.state.doc)) {
              const tr = viewRef.current.state.tr.replaceWith(
                0,
                viewRef.current.state.doc.content.size,
                newPmDoc,
              );
              viewRef.current.dispatch(tr);
            }
          }
          isInitializing.current = false;
        }
      },
    );
  }, [schemaView]);

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
