import React, { useEffect, useRef, useMemo, useState } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  DOMParser as PMDOMParser,
  DOMSerializer,
  Node as PMNode,
} from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import {
  XMLAPI,
  ModelElement,
  ModelNode,
  Element as ApiElement,
  Node as ApiNode,
} from "@miy2/xml-api";

import { xhtmlSubsetSchema } from "../schema/xhtml-subset";
import "./WYSIWYGEditor.css";

interface WYSIWYGEditorProps {
  api: XMLAPI;
  onExternalChange?: () => void;
}

const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({
  api,
  onExternalChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInitializing = useRef(false);
  const [isWellFormed, setIsWellFormed] = useState(
    api.cst ? api.cst.wellFormed : true,
  );

  useEffect(() => {
    // Listen for model changes to update well-formed status
    return api.on((_event) => {
      const wellFormed = api.cst ? api.cst.wellFormed : true;
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
    } catch (e) {
      return null;
    }
  }, [api]); // version removed

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

  // Helper to convert xml-api view DOM to PM DOM (browser nodes)
  // Since SchemaView exposes an internal DOM, we need to map it to browser DOM for PM to parse initial state
  const viewToBrowserDOM = (viewNode: ApiNode): Node | null => {
    if (viewNode.nodeType === 3) {
      // TEXT_NODE
      return document.createTextNode(viewNode.textContent || "");
    }
    if (viewNode.nodeType === 1) {
      // ELEMENT_NODE
      const el = viewNode as ApiElement;

      // Flatten html/body for the editor content
      if (el.tagName === "html" || el.tagName === "body") {
        const fragment = document.createDocumentFragment();
        const children = el.childNodes;
        for (let i = 0; i < children.length; i++) {
          const child = viewToBrowserDOM(children.item(i)!);
          if (child) fragment.appendChild(child);
        }
        return fragment;
      }

      const dom = document.createElement(el.tagName);
      // Attributes
      // ApiElement doesn't expose attributes array easily in public DOM API yet?
      // But ModelElement does.
      const model = el.getModel() as ModelElement;
      model.attributes.forEach((v: string, k: string) =>
        dom.setAttribute(k, v),
      );

      const children = el.childNodes;
      for (let i = 0; i < children.length; i++) {
        const child = viewToBrowserDOM(children.item(i)!);
        if (child) dom.appendChild(child);
      }
      return dom;
    }
    return null;
  };

          // Sync ProseMirror state TO SchemaView (XML)
          const syncToXml = (pmDoc: PMNode) => {
            if (!api.cst || !api.cst.wellFormed) return;
      
            const root = schemaView.getRoot();
            let body = root;
            if (root.tagName === "html") {
              const found = root.querySelector("body");
              if (found) body = found;
            }
      
            // Use DOMSerializer to get a standard DOM fragment from current PM doc
            const serializer = DOMSerializer.fromSchema(xhtmlSubsetSchema);
            const fragment = serializer.serializeFragment(pmDoc.content);
      
            // Reconcile using SchemaView (preserves formatting)
            schemaView.reconcile(fragment as any, { origin: "wysiwyg-editor" }, body);
          };  useEffect(() => {
    if (!editorRef.current) return;

    // Initial state
    const updateInitialState = () => {
      if (viewRef.current) {
        const root = schemaView.getRoot();
        const browserDom = viewToBrowserDOM(root);

        // Wrap in a div if it's a fragment, or just parse
        // PMDOMParser expects a node
        let parseTarget: Node = browserDom!;
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
          // Sync back to xml-api via SchemaView
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
    // Allow updates after initial sync matches xml-api
    // We use setTimeout to ensure the initial transaction is processed
    setTimeout(() => {
      isInitializing.current = false;
    }, 0);

    return () => {
      view.destroy();
    };
  }, [schemaView]); // Depend on schemaView

  // Sync from xml-api to ProseMirror (listen to View events)
  useEffect(() => {
    return schemaView.on((_event: any) => {
      // For now, on any structural change, reload.
      // Granular updates are optimizing.
      if (viewRef.current) {
        isInitializing.current = true;
        const root = schemaView.getRoot();
        const browserDom = viewToBrowserDOM(root);

        let parseTarget: Node = browserDom!;
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
        isInitializing.current = false;
      }
    });
  }, [schemaView]);

  return (
    <div className="wysiwyg-container">
      <div className="wysiwyg-toolbar">
        <button
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
