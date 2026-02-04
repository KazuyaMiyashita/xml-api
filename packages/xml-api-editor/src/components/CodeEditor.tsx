import React, { useEffect, useRef, useMemo } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  keymap,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { XMLAPI, ChangeEvent, CST } from "@miy2/xml-api";
import "./CodeEditor.css";

interface CodeEditorProps {
  api: XMLAPI;
  version?: number;
  onChange?: (newSource: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ api, version, onChange }) => {
  const editorParentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isUpdatingFromApi = useRef(false);

  // Define decorations based on CST
  const cstHighlight = useMemo(() => {
    return ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = this.getDecorations(view);
        }

        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = this.getDecorations(update.view);
          }
        }

        getDecorations(view: EditorView) {
          if (!api.cst) return Decoration.none;

          const widgets: any[] = [];
          const traverse = (node: CST, inheritedClassName: string = "") => {
            let className = inheritedClassName;

            if (
              node.name === "STag" ||
              node.name === "ETag" ||
              node.name === "EmptyElemTag"
            ) {
              className = "syntax-tag";
            } else if (node.name === "Name") {
              if (inheritedClassName === "syntax-tag") {
                className = "syntax-name";
              } else if (node.parent?.name === "Attribute") {
                className = "syntax-attr-name";
              }
            } else if (node.name === "AttValue") {
              className = "syntax-attr-value";
            } else if (node.name === "Comment") {
              className = "syntax-comment";
            } else if (node.name === "CharData") {
              className = "syntax-char-data";
            }

            if (className && (!node.children || node.children.length === 0)) {
              if (node.start < node.end) {
                const from = Math.max(0, node.start);
                const to = Math.min(view.state.doc.length, node.end);
                if (from < to) {
                  widgets.push(
                    Decoration.mark({ class: className }).range(from, to),
                  );
                }
              }
            } else {
              node.children.forEach((child) => traverse(child, className));
            }
          };

          traverse(api.cst);
          widgets.sort((a, b) => a.from - b.from);

          try {
            return Decoration.set(widgets);
          } catch (e) {
            console.warn("Failed to set decorations:", e);
            return Decoration.none;
          }
        }
      },
      {
        decorations: (v) => v.decorations,
      },
    );
  }, [api]);

  const checkForUpdates = () => {
    if (
      viewRef.current &&
      api.source !== viewRef.current.state.doc.toString()
    ) {
      isUpdatingFromApi.current = true;
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: api.source,
        },
      });
      isUpdatingFromApi.current = false;
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, [version, api]);

  useEffect(() => {
    if (!editorParentRef.current) return;

    const startState = EditorState.create({
      doc: api.source,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        cstHighlight,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdatingFromApi.current) {
            update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
              const text = inserted.toString();
              try {
                api.updateSource(fromA, toA, text);
              } catch (e) {
                console.error("Incremental update failed:", e);
              }
            });

            if (onChange) {
              onChange(update.state.doc.toString());
            }
          }
        }),
        EditorView.theme(
          {
            "&": {
              height: "100%",
              backgroundColor: "#282c34",
              color: "#abb2bf",
            },
            ".cm-content": {
              fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
              fontSize: "14px",
            },
            ".cm-gutters": {
              backgroundColor: "#21252b",
              color: "#4b5263",
              border: "none",
            },
            "&.cm-focused": { outline: "none" },
          },
          { dark: true },
        ),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorParentRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [api, cstHighlight]);

  useEffect(() => {
    return api.on((_event: ChangeEvent) => {
      checkForUpdates();
    });
  }, [api]);

  return <div className="code-editor-container" ref={editorParentRef} />;
};

export default CodeEditor;
