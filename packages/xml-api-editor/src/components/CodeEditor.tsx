import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { EditorState, type Range, StateEffect } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import type { ChangeEvent, CST, XMLAPI } from "@miy2/xml-api";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import "./CodeEditor.css";

interface CodeEditorProps {
  api: XMLAPI;
  onChange?: (newSource: string) => void;
}

const forceHighlightUpdate = StateEffect.define<null>();

const CodeEditor: React.FC<CodeEditorProps> = ({ api, onChange }) => {
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
          if (
            update.docChanged ||
            update.viewportChanged ||
            update.transactions.some((tr) =>
              tr.effects.some((e) => e.is(forceHighlightUpdate)),
            )
          ) {
            this.decorations = this.getDecorations(update.view);
          }
        }

        getDecorations(view: EditorView) {
          if (!api.cst) return Decoration.none;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const widgets: Range<Decoration>[] = [];
          const traverse = (node: CST, inheritedClassName = "") => {
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
              node.children.forEach((child) => {
                traverse(child, className);
              });
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

  const checkForUpdates = useCallback(() => {
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
  }, [api.source]);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

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
                api.updateSource(fromA, toA, text, { origin: "code-editor" });
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
  }, [api, cstHighlight, onChange]);

  useEffect(() => {
    return api.on((event: ChangeEvent) => {
      if (event.transaction?.getMeta("origin") === "code-editor") {
        if (viewRef.current) {
          viewRef.current.dispatch({
            effects: forceHighlightUpdate.of(null),
          });
        }
        return;
      }
      checkForUpdates();
    });
  }, [api, checkForUpdates]);

  return <div className="code-editor-container" ref={editorParentRef} />;
};

export default CodeEditor;
