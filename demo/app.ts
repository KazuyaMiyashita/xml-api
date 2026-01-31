import { XMLAPI, Document, Element, CharacterData, Node, createWrapper, DOMObserver, XMLBinder } from "../src/index";

const sourceEditor = document.getElementById("source-editor") as HTMLTextAreaElement;
const treeRoot = document.getElementById("tree-root") as HTMLDivElement;
const propEditor = document.getElementById("prop-editor") as HTMLDivElement;
const status = document.getElementById("status") as HTMLDivElement;

let api: XMLAPI;
let doc: Document;
let selectedNode: Node | null = null;
let binder: XMLBinder;

const initialXml = `<root>
  <item id="1" status="active">
    <name>Apple</name>
    <price currency="USD">1.50</price>
  </item>
  <!-- Out of stock -->
  <item id="2" status="inactive">
    <name>Banana</name>
    <price>0.80</price>
  </item>
</root>`;

sourceEditor.value = initialXml;

function init() {
  const input = sourceEditor.value;
  api = new XMLAPI(input);
  doc = new Document();
  
  // Setup Bridge
  binder = (api as any).binder; // Access private binder
  
  const observer: DOMObserver = {
    onAttributeChange: (element, name, value) => {
      const model = element.getModel();
      // We assume model is ModelElement because Element wraps ModelElement
      const patch = binder.calcSetAttributePatch(model as any, name, value || ""); 
      // Note: calcSetAttributePatch expects string value. removeAttribute logic might need update in binder or here.
      // Current binder doesn't support removeAttribute patch calculation explicitly?
      // Let's check binder... it returns null if not found for update, but for remove?
      // Binder `calcSetAttributePatch` sets value.
      // If value is null (remove), we might need a different method. 
      // For now, let's just support setAttribute.
      
      if (patch && value !== null) {
        api.updateInput(patch.start, patch.end, patch.text);
        sourceEditor.value = api.input;
        // Don't re-render entire tree to keep selection?
        // But source update triggers re-parse usually.
        // API.updateInput updates CST/Model.
        // If we are observing model, we are fine.
        // But we need to refresh properties panel if needed.
        updateStatus();
      } else {
        console.warn("Could not calculate patch for attribute change");
      }
    },
    onTextChange: (node, text) => {
      const model = node.getModel();
       // For Text nodes, we need parent element to calculate patch in current Binder implementation?
       // Binder has calcUpdateTextPatch(element, text). 
       // It replaces content of element.
       // Does it support individual text node updates?
       // calcUpdateTextPatch takes ModelElement.
       
       if (model.parent) {
         // This assumes the element has only one text node or we replace all content?
         // Binder.calcUpdateTextPatch replaces *content* of element.
         // So it matches textContent semantic.
         const patch = binder.calcUpdateTextPatch(model.parent, text);
         if (patch) {
           api.updateInput(patch.start, patch.end, patch.text);
           sourceEditor.value = api.input;
           updateStatus();
         }
       }
    },
    onChildAdded: () => {},
    onChildRemoved: () => {}
  };
  
  doc.setObserver(observer);
  
  updateStatus();
  renderTree();
}

function updateStatus() {
  if (api.cst && api.cst.wellFormed) {
    status.textContent = "OK";
    status.style.color = "green";
  } else {
    status.textContent = "Parse Error";
    status.style.color = "red";
  }
}

function renderTree() {
  treeRoot.innerHTML = "";
  if (!api.model) return;
  
  // Hydrate DOM wrapper
  doc.documentElement = createWrapper(api.model, doc) as Element;
  
  treeRoot.appendChild(renderNode(doc.documentElement));
}

function renderNode(node: Node): HTMLElement {
  const div = document.createElement("div");
  div.className = "node";
  if (node === selectedNode) div.classList.add("selected");
  
  div.onclick = (e) => {
    e.stopPropagation();
    selectNode(node);
  };
  
  if (node.nodeType === node.ELEMENT_NODE) {
    const el = node as Element;
    const tagSpan = document.createElement("span");
    tagSpan.className = "tag-name";
    tagSpan.textContent = el.tagName;
    div.appendChild(tagSpan);
    
    // Attributes (visual only, simplified)
    // We can't iterate attributes easily via DOM API (no .attributes list exposed in our minimal DOM)
    // We access model directly for rendering helper
    const model = el.getModel() as any; // ModelElement
    if (model.attributes) {
      for (const [k, v] of model.attributes) {
         div.appendChild(document.createTextNode(" "));
         const attrName = document.createElement("span");
         attrName.className = "attr-name";
         attrName.textContent = k;
         div.appendChild(attrName);
         div.appendChild(document.createTextNode("="));
         const attrVal = document.createElement("span");
         attrVal.className = "attr-value";
         attrVal.textContent = `"${v}"`;
         div.appendChild(attrVal);
      }
    }
    
    // Children
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      div.appendChild(renderNode(children.item(i)!));
    }
  } else if (node.nodeType === node.TEXT_NODE) {
    const span = document.createElement("span");
    span.className = "text-node";
    // Truncate/escape
    span.textContent = node.textContent;
    div.appendChild(span);
  } else {
    div.textContent = `[${node.nodeName}]`;
  }
  
  return div;
}

function selectNode(node: Node) {
  selectedNode = node;
  
  // Re-render tree to show selection highlight
  // In efficient app, just toggle class.
  // Here we assume small tree.
  const allNodes = treeRoot.querySelectorAll(".node");
  allNodes.forEach(n => n.classList.remove("selected"));
  // Searching corresponding DOM element is hard without reference map.
  // Just re-render tree is safest for prototype.
  renderTree();
  
  renderProps(node);
}

function renderProps(node: Node) {
  propEditor.innerHTML = "";
  
  const typeInfo = document.createElement("div");
  typeInfo.textContent = `Type: ${node.nodeName}`;
  propEditor.appendChild(typeInfo);
  
  if (node.nodeType === node.ELEMENT_NODE) {
    const el = node as Element;
    const model = el.getModel() as any;
    
    // Edit Attributes
    const attrsHeader = document.createElement("h4");
    attrsHeader.textContent = "Attributes";
    propEditor.appendChild(attrsHeader);
    
    for (const [key, value] of model.attributes) {
      const row = document.createElement("div");
      
      const label = document.createElement("label");
      label.textContent = key + ": ";
      
      const input = document.createElement("input");
      input.value = value;
      input.onchange = () => {
        el.setAttribute(key, input.value);
      };
      
      row.appendChild(label);
      row.appendChild(input);
      propEditor.appendChild(row);
    }
    
    // Add new attribute
    const addRow = document.createElement("div");
    const nameInput = document.createElement("input");
    nameInput.placeholder = "New Attr";
    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    addBtn.onclick = () => {
      if (nameInput.value) {
        el.setAttribute(nameInput.value, "");
        renderProps(node); // refresh
      }
    };
    addRow.appendChild(nameInput);
    addRow.appendChild(addBtn);
    propEditor.appendChild(addRow);

    // Edit Text Content (Simple)
    const textHeader = document.createElement("h4");
    textHeader.textContent = "Text Content";
    propEditor.appendChild(textHeader);
    
    const textInput = document.createElement("input");
    textInput.value = el.textContent || "";
    textInput.onchange = () => {
      el.textContent = textInput.value;
    };
    propEditor.appendChild(textInput);

  } else if (node.nodeType === node.TEXT_NODE) {
    const cd = node as CharacterData;
    const textHeader = document.createElement("h4");
    textHeader.textContent = "Data";
    propEditor.appendChild(textHeader);
    
    const textInput = document.createElement("input");
    textInput.value = cd.data;
    textInput.onchange = () => {
      cd.data = textInput.value;
    };
    propEditor.appendChild(textInput);
  }
}

sourceEditor.oninput = () => {
  const newVal = sourceEditor.value;
  // Diff? Or just re-init?
  // Re-init for simplicity in this direction.
  // In real app, we use api.updateInput with range.
  // Here we just replace the whole thing?
  // XMLAPI has `updateInput`.
  // But if user types freely, it's a full replacement usually unless we track cursor.
  // For prototype, we just re-create API.
  api = new XMLAPI(newVal);
  binder = (api as any).binder;
  updateStatus();
  renderTree();
};

init();
