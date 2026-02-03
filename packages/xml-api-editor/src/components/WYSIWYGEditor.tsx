import React, { useEffect, useRef, useMemo } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  Schema,
  DOMParser as PMDOMParser,
  DOMSerializer,
  Node as PMNode,
} from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark } from "prosemirror-commands";
// @ts-ignore
import { XMLAPI, SchemaView, SchemaViewConfig } from "@miy2/xml-api";
// @ts-ignore
import { ChangeEvent } from "@miy2/xml-api/dist/xml-api-events";
// @ts-ignore
import {
  ModelElement,
  ModelNodeType,
  ModelNode,
} from "@miy2/xml-api/model/xml-api-model";
// @ts-ignore
import { Element as ApiElement, Node as ApiNode } from "@miy2/xml-api/dom";

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
  const isUpdatingFromApi = useRef(false);
  
  // Create SchemaView
  const schemaView = useMemo(() => {
    return api.createView({
      filter: (node: ModelNode) => {
        // Simple filter for XHTML subset
        if (node.getType() === ModelNodeType.Element) {
          const tagName = (node as ModelElement).tagName;
          // Allow basic tags
          return ["html", "body", "p", "strong", "em", "div", "span", "h1", "h2", "h3"].includes(tagName);
        }
        if (node.getType() === ModelNodeType.Text) return true;
        return false;
      }
    });
  }, [api]);

  // Helper to convert xml-api view DOM to PM DOM (browser nodes)
  // Since SchemaView exposes an internal DOM, we need to map it to browser DOM for PM to parse initial state
  const viewToBrowserDOM = (viewNode: ApiNode): Node | null => {
      if (viewNode.nodeType === 3) { // TEXT_NODE
        return document.createTextNode(viewNode.textContent || "");
      }
      if (viewNode.nodeType === 1) { // ELEMENT_NODE
        const el = viewNode as ApiElement;
        
        // Flatten html/body for the editor content
        if (el.tagName === "html" || el.tagName === "body") {
           const fragment = document.createDocumentFragment();
           const children = el.childNodes;
           for (let i = 0; i < children.length; i++) {
             const child = viewToBrowserDOM(children.item(i)!);
             if (child) fragment.appendChild(child);
           }
           return fragment as any;
        }

        const dom = document.createElement(el.tagName);
        // Attributes
        // ApiElement doesn't expose attributes array easily in public DOM API yet?
        // But ModelElement does.
        const model = (el as any).getModel() as ModelElement;
        model.attributes.forEach((v, k) => dom.setAttribute(k, v));
        
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
      
      // Simple Reconciliation between Browser DOM (fragment) and SchemaView DOM (body)
      const reconcile = (bParent: Node, vParent: ApiElement) => {
          const bChildren = Array.from(bParent.childNodes);
          const vChildren = Array.from(vParent.childNodes);
          
          // Match by index (simple for now)
          const maxLength = Math.max(bChildren.length, vChildren.length);
          
          for (let i = 0; i < maxLength; i++) {
              const bNode = bChildren[i];
              const vNode = vChildren[i];
              
              if (!bNode && vNode) {
                  // Removed from Browser -> Remove from View
                  vParent.removeChild(vNode);
              } else if (bNode && !vNode) {
                  // Added to Browser -> Add to View
                  if (bNode.nodeType === Node.TEXT_NODE) {
                      vParent.appendChild(schemaView.getDocument().createTextNode(bNode.textContent || ""));
                  } else if (bNode.nodeType === Node.ELEMENT_NODE) {
                      const bEl = bNode as HTMLElement;
                      const vNew = schemaView.getDocument().createElement(bEl.tagName.toLowerCase());
                      // Initial attributes
                      for (let j = 0; j < bEl.attributes.length; j++) {
                          vNew.setAttribute(bEl.attributes[j].name, bEl.attributes[j].value);
                      }
                      vParent.appendChild(vNew);
                      // Recursively sync children
                      reconcile(bNode, vNew);
                  }
              } else if (bNode && vNode) {
                  // Both exist -> Update if needed
                  if (bNode.nodeType !== vNode.nodeType) {
                      // Different type -> Replace
                      vParent.removeChild(vNode);
                      // Next iteration will handle addition
                      i--; 
                      continue;
                  }
                  
                  if (bNode.nodeType === Node.TEXT_NODE) {
                      if (bNode.textContent !== vNode.textContent) {
                          vNode.textContent = bNode.textContent;
                      }
                  } else if (bNode.nodeType === Node.ELEMENT_NODE) {
                      const bEl = bNode as HTMLElement;
                      const vEl = vNode as ApiElement;
                      
                      if (bEl.tagName.toLowerCase() !== vEl.tagName.toLowerCase()) {
                          // Different tag -> Replace
                          vParent.removeChild(vNode);
                          i--;
                          continue;
                      }
                      
                      // Update Attributes
                      const bAttrs = bEl.attributes;
                      // Set/Update
                      for (let j = 0; j < bAttrs.length; j++) {
                          if (vEl.getAttribute(bAttrs[j].name) !== bAttrs[j].value) {
                              vEl.setAttribute(bAttrs[j].name, bAttrs[j].value);
                          }
                      }
                      // Remove missing (simplified: only handle known attributes if needed, or clear all and reset)
                      
                      // Recursively reconcile children
                      reconcile(bNode, vEl);
                  }
              }
          }
      };
      
      reconcile(fragment, body);
  };

  useEffect(() => {
    if (!editorRef.current) return;

    // Initial state
    const updateInitialState = () => {
      if (viewRef.current) {
        isUpdatingFromApi.current = true;
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

        const pmDoc = PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(parseTarget);
        
        const tr = viewRef.current.state.tr.replaceWith(
          0,
          viewRef.current.state.doc.content.size,
          pmDoc,
        );
        viewRef.current.dispatch(tr);
        isUpdatingFromApi.current = false;
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

        if (tr.docChanged && !isUpdatingFromApi.current) {
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
    updateInitialState();

    return () => {
      view.destroy();
    };
  }, [schemaView]); // Depend on schemaView

  // Sync from xml-api to ProseMirror (listen to View events)
  useEffect(() => {
    return schemaView.on((_event) => {
        // For now, on any structural change, reload.
        // Granular updates are optimizing.
        if (viewRef.current && !isUpdatingFromApi.current) {
            isUpdatingFromApi.current = true;
            const root = schemaView.getRoot();
            const browserDom = viewToBrowserDOM(root);
            
            let parseTarget: Node = browserDom!;
            if (parseTarget.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                const div = document.createElement("div");
                div.appendChild(parseTarget);
                parseTarget = div;
            }

            const newPmDoc = PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(parseTarget);

            if (!newPmDoc.eq(viewRef.current.state.doc)) {
              const tr = viewRef.current.state.tr.replaceWith(
                0,
                viewRef.current.state.doc.content.size,
                newPmDoc,
              );
              viewRef.current.dispatch(tr);
            }
            isUpdatingFromApi.current = false;
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
