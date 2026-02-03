import { useEffect, useState, useCallback, useRef, useMemo } from "react";
// @ts-ignore
import { XMLAPI } from "@miy2/xml-api";
// @ts-ignore
import { ChangeEvent } from "@miy2/xml-api/dist/xml-api-events";
import CodeEditor from "./components/CodeEditor";
import WYSIWYGEditor from "./components/WYSIWYGEditor";
import MeiEditor from "./components/MeiEditor";
import { detectDocumentType, DocumentType } from "./utils/xml-detector";
import "./App.css";

interface LogEntry {
  timestamp: string;
  type: string;
  detail: string;
}

function App() {
  const [api, setApi] = useState<XMLAPI | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [version, setVersion] = useState(0); // Add version state for manual syncing
  const [eventLogs, setEventLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const forceUpdate = useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);

  const handleVersionUpdate = useCallback(() => {
    setVersion((v) => v + 1);
    // Logs are updated via api.on listener automatically
  }, []);

  const addLog = useCallback((event: ChangeEvent) => {
    const timestamp = new Date().toLocaleTimeString();
    let detail = "";

    if (event.type === "full") {
      detail = "Full update";
    } else if (event.type === "structure") {
      detail = `Structure changed at ${event.target?.getType()} (${event.target?.id})`;
    } else if (event.type === "attribute") {
      detail = `Attribute changed: ${event.key} = ${event.newValue} on ${event.target?.getType()}`;
    } else if (event.type === "text") {
      detail = `Text changed on ${event.target?.getType()} (${event.target?.id})`;
    }

    setEventLogs((prev) => [
      ...prev.slice(-19),
      { timestamp, type: event.type, detail },
    ]);
  }, []);

  // Detect document type
  // Re-run detection whenever eventLogs change (implies model might have changed) or api changes
  const docTypeInfo = useMemo(() => {
    if (!api) return { type: DocumentType.UNKNOWN, rootTag: "" };
    return detectDocumentType(api);
  }, [api, eventLogs]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [eventLogs]);

  useEffect(() => {
    const loadXml = async () => {
      try {
        const response = await fetch("/sample_01.xml");
        if (!response.ok) {
          throw new Error(`Failed to load XML: ${response.statusText}`);
        }
        const text = await response.text();
        const xmlApi = new XMLAPI(text);
        setApi(xmlApi);

        // Listen for changes and update logs
        xmlApi.on((event: ChangeEvent) => {
          setEventLogs((prev) => {
            const timestamp = new Date().toLocaleTimeString();
            let detail = "";
            if (event.type === "full") detail = "Full update";
            else if (event.type === "structure")
              detail = `Structure changed at ${event.target?.getType()} (${event.target?.id})`;
            else if (event.type === "attribute")
              detail = `Attribute changed: ${event.key} = ${event.newValue} on ${event.target?.getType()}`;
            else if (event.type === "text")
              detail = `Text changed on ${event.target?.getType()} (${event.target?.id})`;

            return [
              ...prev.slice(-19),
              { timestamp, type: event.type, detail },
            ];
          });

          // Note: forceUpdate is removed. Editors must subscribe and update themselves.
        });
      } catch (err: any) {
        setError(err.message);
      }
    };

    loadXml();
  }, [addLog, forceUpdate]);

  const handleCodeChange = (_newSource: string) => {
    // CodeEditor now handles api.updateSource incrementally.
    // We can use this callback for other side effects if needed.
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>
          XML API Editor{" "}
          <span
            style={{
              fontSize: "0.6em",
              fontWeight: "normal",
              opacity: 0.8,
              marginLeft: "10px",
            }}
          >
            Type: {docTypeInfo.type}
          </span>
        </h1>
      </header>
      <main className="main-content">
        <div className="pane pane-left">
          <div className="pane-header">
            {docTypeInfo.type === DocumentType.MEI
              ? "MEI View"
              : "WYSIWYG Editor"}
          </div>
          <div className="pane-body">
            {api ? (
              docTypeInfo.type === DocumentType.MEI ? (
                <MeiEditor api={api} />
              ) : (
                <WYSIWYGEditor
                  api={api}
                  onExternalChange={handleVersionUpdate}
                />
              )
            ) : (
              <div>Loading...</div>
            )}
          </div>
          <div
            className="pane-footer"
            style={{
              height: "150px",
              borderTop: "1px solid #ccc",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="pane-header"
              style={{ background: "#eee", color: "#333" }}
            >
              Event Log
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "5px",
                fontSize: "11px",
                fontFamily: "monospace",
              }}
            >
              {eventLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: "2px" }}>
                  <span style={{ color: "#888" }}>[{log.timestamp}]</span>
                  <strong style={{ color: "#007acc" }}> {log.type}</strong>:{" "}
                  {log.detail}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
        <div className="pane pane-right">
          <div className="pane-header">Source Code</div>
          <div className="pane-body">
            {error ? (
              <div className="error-message">Error: {error}</div>
            ) : api ? (
              <CodeEditor
                api={api}
                version={version}
                onChange={handleCodeChange}
              />
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
