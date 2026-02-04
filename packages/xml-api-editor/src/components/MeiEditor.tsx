import type { XMLAPI } from "@miy2/xml-api";
import type React from "react";

interface MeiEditorProps {
  api: XMLAPI;
}

const MeiEditor: React.FC<MeiEditorProps> = ({ api }) => {
  return (
    <div
      style={{ padding: "20px", backgroundColor: "#fff9fa", height: "100%" }}
    >
      <h2>🎼 MEI Editor</h2>
      <p>Specialized editor for Music Encoding Initiative data.</p>
      <div
        style={{
          border: "2px dashed #d66",
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          marginTop: "20px",
          color: "#d66",
        }}
      >
        Verovio Score Rendering would go here.
      </div>
      <div style={{ marginTop: "20px", fontSize: "0.8em", color: "#666" }}>
        Root Tag: {api.model?.tagName}
      </div>
    </div>
  );
};

export default MeiEditor;
