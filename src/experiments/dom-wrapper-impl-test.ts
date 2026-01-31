import { CustomDocument, CustomElement } from "./dom-wrapper-impl";
import { ModelElement, ModelText } from "../core/model/xml-api-model";

function runTest() {
  console.log("Starting Custom DOM Wrapper test...");

  const rootModel = new ModelElement("root");
  const childModel = new ModelElement("child");
  childModel.setAttribute("attr", "original");
  rootModel.addChild(childModel);
  rootModel.addChild(new ModelText("hello"));

  const doc = new CustomDocument();
  const rootWrapper = new CustomElement(rootModel);
  doc.setDocumentElement(rootWrapper);

  console.log("Root tag name:", doc.documentElement?.tagName);
  console.log("Child attribute:", doc.documentElement?.children[0].getAttribute("attr"));
  console.log("Text content:", doc.documentElement?.textContent);

  console.log("\nModifying via wrapper...");
  const firstChild = doc.documentElement?.children[0];
  if (firstChild) {
    firstChild.setAttribute("attr", "modified");
  }

  const newChild = doc.createElement("new-child");
  newChild.setAttribute("status", "fresh");
  doc.documentElement?.appendChild(newChild);

  console.log("\nVerifying underlying model...");
  console.log("Model child attribute:", childModel.attributes.get("attr"));
  console.log("Model children count:", rootModel.children.length);
  const lastChildModel = rootModel.children[rootModel.children.length - 1];
  if (lastChildModel instanceof ModelElement) {
    console.log("Last child model tag:", lastChildModel.tagName);
    console.log("Last child model attribute:", lastChildModel.attributes.get("status"));
  }

  if (childModel.attributes.get("attr") === "modified" && rootModel.children.length === 3) {
    console.log("\nSUCCESS: Custom DOM wrapper correctly manipulates underlying model.");
  } else {
    console.log("\nFAILURE: Sync issues.");
  }
}

runTest();
