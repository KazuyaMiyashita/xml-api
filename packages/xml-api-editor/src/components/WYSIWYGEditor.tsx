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
import { XMLAPI } from "@miy2/xml-api";
// @ts-ignore
import { ChangeEvent } from "@miy2/xml-api/dist/xml-api-events";
// @ts-ignore
import {
  ModelElement,
  ModelNodeType,
  ModelNode,
} from "@miy2/xml-api/model/xml-api-model";
// @ts-ignore
import { Formatter } from "@miy2/xml-api/model/formatter";

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

  // Helper to convert xml-api model to DOM (which ProseMirror can parse)
  const modelToDOM = useMemo(() => {
    const convert = (node: ModelNode): Node | null => {
      if (node.getType() === ModelNodeType.Text) {
        return document.createTextNode((node as any).text);
      }
      if (node.getType() === ModelNodeType.Element) {
        const el = node as ModelElement;

        // Skip html/body and just convert their children for the doc
        if (el.tagName === "html" || el.tagName === "body") {
          const fragment = document.createDocumentFragment();
          el.children.forEach((child) => {
            const childDom = convert(child);
            if (childDom) fragment.appendChild(childDom);
          });
          return fragment as any;
        }

        const dom = document.createElement(el.tagName);
        el.attributes.forEach((v, k) => dom.setAttribute(k, v));
        el.children.forEach((child) => {
          const childDom = convert(child);
          if (childDom) dom.appendChild(childDom);
        });
        return dom;
      }
      return null;
    };
    return convert;
  }, []);

  // Helper to convert ProseMirror Document back to XML string for xml-api
  const pmToXml = (pmDoc: PMNode): string => {
    const serializer = DOMSerializer.fromSchema(xhtmlSubsetSchema);
    const fragment = serializer.serializeFragment(pmDoc.content);
    const div = document.createElement("div");
    div.appendChild(fragment);

    // Use XMLAPI's Formatter to prettify the body content
    // We create a temporary API instance just to parse and format the body content
    // This ensures we respect the library's formatting logic
    const tempBodyXml = `<body>${div.innerHTML}</body>`;
    const tempApi = new XMLAPI(tempBodyXml);

    // We want to format the *children* of the body, not the body itself necessarily,
    // or we format the body and strip the tag.
    // Let's format the body and see.
    const formatter = new Formatter({ indent: "  " }); // Default indent
    let formattedBodyContent = "";

    if (tempApi.model && tempApi.model.children.length > 0) {
      // Assuming tempApi.model is the root, which might be implied <html> or just the element we passed?
      // XMLAPI usually expects full doc or at least root.
      // If we pass `<body>...</body>`, model will be `<body>`.

      // We want to format the *content* of the body.
      // Formatter formats a node.
      const formattedBody = formatter.format(tempApi.model);

      // Strip <body> and </body>
      // formattedBody is like "<body>\n  <h1>...</h1>\n</body>"
      const match = formattedBody.match(/<body[^>]*>([\s\S]*?)<\/body>/);
      if (match) {
        formattedBodyContent = match[1];
        // If the content starts with newline, we might want to keep it or adjust
        // But let's trust the formatter's indentation relative to body
      } else {
        formattedBodyContent = div.innerHTML; // Fallback
      }
    } else {
      formattedBodyContent = div.innerHTML;
    }

    // Get the current source and replace only the body content to preserve head/comments
    const currentSource = api.source;
    const bodyMatch = currentSource.match(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i);

    if (bodyMatch) {
      const before = currentSource.substring(
        0,
        bodyMatch.index! + bodyMatch[1].length,
      );
      const after = currentSource.substring(
        bodyMatch.index! + bodyMatch[0].length - bodyMatch[3].length,
      );
      const result = `${before}${formattedBodyContent}${after}`;
      return result;
    }

    return `<html><body>${formattedBodyContent}</body></html>`;
  };

  useEffect(() => {
    if (!editorRef.current) return;

    // Initial state
    const updateInitialState = () => {
      const docModel = api.model;
      if (docModel && viewRef.current) {
        isUpdatingFromApi.current = true;
        const tempDom = modelToDOM(docModel);
        const pmDoc = PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(
          tempDom as any,
        );
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
          // Sync back to xml-api
          const newXml = pmToXml(newState.doc);
          try {
            // Full update for now as ProseMirror -> XML mapping is complex for incremental
            api.updateSource(0, api.source.length, newXml);
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
  }, [api, modelToDOM]);

  // Sync from xml-api to ProseMirror
  useEffect(() => {
    return api.on((_event: ChangeEvent) => {
      if (viewRef.current && !isUpdatingFromApi.current && api.model) {
        isUpdatingFromApi.current = true;
        const tempDom = modelToDOM(api.model);
        const newPmDoc = PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(
          tempDom as any,
        );

        // Only update if actually different to avoid selection loss
        if (!newPmDoc.eq(viewRef.current.state.doc)) {
          const tr = viewRef.current.state.tr.replaceWith(
            0,
            viewRef.current.state.doc.content.size,
            newPmDoc,
          );
          // Preserve selection if possible? (Simplified for now)
          viewRef.current.dispatch(tr);
        }
        isUpdatingFromApi.current = false;
      }
    });
  }, [api, modelToDOM]);

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
