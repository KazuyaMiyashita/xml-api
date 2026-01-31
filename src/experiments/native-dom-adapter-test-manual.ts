import { NativeDOMAdapter } from "./native-dom-adapter";
import { ModelElement, ModelText } from "../core/model/xml-api-model";

async function runTest() {
  console.log("Starting NativeDOMAdapter test...");

  const adapter = new NativeDOMAdapter();
  const root = new ModelElement("root");
  const child = new ModelElement("child");
  child.setAttribute("attr", "value");
  root.addChild(child);
  root.addChild(new ModelText("hello"));

  adapter.project(root);
  const doc = adapter.getDocument();

  console.log("Initial DOM:", new (adapter as any).dom.window.XMLSerializer().serializeToString(doc));

  adapter.observe();

  const domChild = doc.documentElement!.firstChild as any;
  console.log("Changing attribute in DOM...");
  domChild.setAttribute("attr", "new-value");

  // Wait for MutationObserver
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log("Model attribute after DOM change:", child.attributes.get("attr"));
  if (child.attributes.get("attr") === "new-value") {
    console.log("SUCCESS: Attribute synced.");
  } else {
    console.log("FAILURE: Attribute not synced.");
  }

  const domText = doc.documentElement!.childNodes[1] as any;
  console.log("Changing text in DOM...");
  domText.data = "new text";

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log("Model text after DOM change:", (root.children[1] as ModelText).text);
  if ((root.children[1] as ModelText).text === "new text") {
    console.log("SUCCESS: Text synced.");
  } else {
    console.log("FAILURE: Text not synced.");
  }
}

runTest().catch(console.error);
