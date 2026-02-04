import { type ModelElement, ModelNodeType, type XMLAPI } from "@miy2/xml-api";

export enum DocumentType {
  XHTML = "XHTML",
  MEI = "MEI", // Music Encoding Initiative
  UNKNOWN = "UNKNOWN",
}

export interface DocumentInfo {
  type: DocumentType;
  rootTag: string;
  namespace?: string;
}

/**
 * Detects the document type based on the root element and namespace.
 * @param api The XMLAPI instance.
 */
export function detectDocumentType(api: XMLAPI): DocumentInfo {
  const model = api.model;
  if (!model || model.getType() !== ModelNodeType.Element) {
    return { type: DocumentType.UNKNOWN, rootTag: "" };
  }

  // model is ModelElement when getType() is Element
  const element = model as ModelElement;
  const rootTag = element.tagName;
  const namespace = element.attributes.get("xmlns");

  // Basic detection logic
  if (rootTag === "html") {
    if (namespace === "http://www.w3.org/1999/xhtml" || !namespace) {
      return { type: DocumentType.XHTML, rootTag, namespace };
    }
  }

  if (rootTag === "mei" || rootTag === "mei:mei") {
    if (namespace?.includes("music-encoding.org")) {
      return { type: DocumentType.MEI, rootTag, namespace };
    }
    // Assume MEI if tag is mei
    return { type: DocumentType.MEI, rootTag, namespace };
  }

  return { type: DocumentType.UNKNOWN, rootTag, namespace };
}
