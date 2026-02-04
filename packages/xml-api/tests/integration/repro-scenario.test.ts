import {
  ModelCDATA,
  ModelComment,
  ModelElement,
  type ModelNode,
  ModelText,
} from "../../src/model/xml-api-model";
import { XMLAPI } from "../../src/xml-api";

function modelToXML(node: ModelNode): string {
  if (node instanceof ModelElement) {
    let xml = `<${node.tagName}`;
    for (const [key, value] of node.attributes) {
      xml += ` ${key}="${value}"`;
    }
    xml += ">";
    for (const child of node.children) {
      xml += modelToXML(child);
    }
    xml += `</${node.tagName}>`;
    return xml;
  } else if (node instanceof ModelText) {
    return node.text;
  } else if (node instanceof ModelComment) {
    return `<!--${node.content}-->`;
  } else if (node instanceof ModelCDATA) {
    return `<![CDATA[${node.content}]]>`;
  }
  return "";
}

describe("Reproduction Scenario: Manual Sync Fragility", () => {
  test("should handle full replacement followed by incremental update without breaking sync", () => {
    // Initial: Dense XML
    const api = new XMLAPI(`<body><h1>Title</h1></body>`);

    // 1. Reformat the document (Full replacement via updateSource)
    // This previously might have caused ID shifts or stale model if not handled correctly
    api.updateSource(0, api.source.length, `<body>\n  <h1>Title</h1>\n</body>`);

    expect(api.source).toBe(`<body>\n  <h1>Title</h1>\n</body>`);
    if (api.model) {
      expect(modelToXML(api.model)).toBe(`<body>\n  <h1>Title</h1>\n</body>`);
    } else {
      throw new Error("Model should not be null");
    }

    // 2. Perform a small edit (Incremental update)
    const start = api.source.indexOf("Title") + 5;
    // Insert " Edited" after "Title"
    api.updateSource(start, start, " Edited");

    // Result check
    const expected = `<body>\n  <h1>Title Edited</h1>\n</body>`;
    expect(api.source).toBe(expected);
    if (api.model) {
      expect(modelToXML(api.model)).toBe(expected);
    } else {
      throw new Error("Model should not be null");
    }
  });
});
