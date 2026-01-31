
describe('Demo App Integration', () => {
  let sourceEditor: any;
  let treeRoot: any;
  let propEditor: any;
  let status: any;

  // Minimal DOM Mock
  class MockNode {
    childNodes: MockNode[] = [];
    parentNode: MockNode | null = null;
    _textContent: string = "";

    get textContent(): string {
        if (this.childNodes.length > 0) {
            return this.childNodes.map(c => c.textContent).join("");
        }
        return this._textContent;
    }
    set textContent(v: string) {
        this._textContent = v;
        this.childNodes = [];
    }

    appendChild(child: MockNode) {
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }
  }

  class MockElement extends MockNode {
    tagName: string;
    className: string = "";
    classList = {
        _classes: new Set<string>(),
        add(c: string) { this._classes.add(c); },
        remove(c: string) { this._classes.delete(c); },
        contains(c: string) { return this._classes.has(c); },
    };
    style = { color: "" };
    value: string = "";
    
    _innerHTML: string = "";
    get innerHTML() { return this._innerHTML; }
    set innerHTML(v: string) { 
        this._innerHTML = v; 
        this.childNodes = []; // Clear children on innerHTML set
        // Note: We don't parse HTML here, assuming it's mostly used for clearing
    }

    onclick: ((e: any) => void) | null = null;
    oninput: ((e: any) => void) | null = null;

    constructor(tagName: string) {
      super();
      this.tagName = tagName.toUpperCase();
    }
    
    querySelectorAll(selector: string) { 
        // Mock implementation for selection highlight clearing
        return []; 
    }
  }

  class MockText extends MockNode {
      constructor(text: string) {
          super();
          this._textContent = text;
      }
  }

  const mockElements: Record<string, MockElement> = {};

  beforeEach(() => {
    // Reset mocks
    mockElements["source-editor"] = new MockElement("TEXTAREA");
    mockElements["tree-root"] = new MockElement("DIV");
    mockElements["prop-editor"] = new MockElement("DIV");
    mockElements["status"] = new MockElement("DIV");

    const doc = {
        createElement: (tag: string) => new MockElement(tag),
        createTextNode: (text: string) => new MockText(text),
        getElementById: (id: string) => mockElements[id] || null,
    };

    (global as any).document = doc;
    (global as any).HTMLTextAreaElement = MockElement;
    (global as any).HTMLDivElement = MockElement;
    // App uses specific element types for casting, so we mock them
    
    // Reset modules to re-run app.ts
    jest.resetModules();
    require('./app');

    sourceEditor = mockElements["source-editor"];
    treeRoot = mockElements["tree-root"];
    status = mockElements["status"];
    propEditor = mockElements["prop-editor"];
  });

  afterEach(() => {
      delete (global as any).document;
      delete (global as any).HTMLTextAreaElement;
      delete (global as any).HTMLDivElement;
  });

  test('Initial render should populate tree', () => {
    // App.ts sets sourceEditor.value initially
    expect(sourceEditor.value).toContain('<root>');
    
    // It calls renderTree()
    // treeRoot should have children
    expect(treeRoot.childNodes.length).toBeGreaterThan(0);
    
    // Check content
    // We need to traverse or check textContent
    expect(treeRoot.textContent).toContain('Apple');
    expect(status.textContent).toBe('OK');
  });

  test('Updating source should update tree', () => {
    sourceEditor.value = '<new>Changed</new>';
    // Trigger input
    if (sourceEditor.oninput) {
        sourceEditor.oninput({} as any);
    }

    expect(treeRoot.textContent).toContain('new');
    expect(treeRoot.textContent).toContain('Changed');
    expect(status.textContent).toBe('OK');
  });

  test('Invalid XML should show error', () => {
    sourceEditor.value = '<broken>';
    if (sourceEditor.oninput) {
        sourceEditor.oninput({} as any);
    }

    expect(status.textContent).toBe('Parse Error');
    expect(status.style.color).toBe('red');
  });

  test('Consecutive attribute updates should work (reproduction of stale binder bug)', () => {
    // 1. Initial State: <root><item ...><name>Apple</name>...
    
    // Check if tree is populated
    if (treeRoot.childNodes.length === 0) throw new Error("Tree not rendered");

    // The first child should be the root element wrapper (div.node)
    // <div class="node"><span class="tag-name">root</span>...</div>
    const rootDiv = treeRoot.childNodes[0];
    
    // Find item node. It's a child of rootDiv.
    // rootDiv children: span.tag-name, text nodes (indent), div.node (item), ...
    const itemNode = rootDiv.childNodes.find((n: any) => 
        n.tagName === "DIV" && 
        n.childNodes.some((c: any) => c.textContent === "item")
    );
    
    if (!itemNode) {
         // Debug info
         const childrenTags = rootDiv.childNodes.map((n: any) => {
             if (n.tagName === "SPAN") return `SPAN:${n.textContent}`;
             if (n.tagName === "DIV") return `DIV`;
             return n.constructor.name;
         }).join(", ");
         throw new Error(`Item node not found in root children. Found: ${childrenTags}`);
    }
    
    // Simulate click
    if (itemNode.onclick) itemNode.onclick({ stopPropagation: () => {} });
    
    // Prop editor should be populated
    // Check propEditor children
    const idRow = propEditor.childNodes.find((n: any) => n.textContent && n.textContent.startsWith("id: "));
    if (!idRow) {
         const props = propEditor.childNodes.map((n: any) => n.textContent).join(", ");
         throw new Error(`ID row not found in prop editor. Content: ${props}`);
    }
    
    const idInput = idRow.childNodes[1]; // Input element
    
    // 1st Edit: Change id to "1a"
    idInput.value = "1a";
    if (idInput.onchange) idInput.onchange({});
    
    // Check if source updated
    expect(sourceEditor.value).toContain('id="1a"');
    
    // 2nd Edit: Change id to "1ab"
    // This requires the binder to be fresh.
    idInput.value = "1ab";
    if (idInput.onchange) idInput.onchange({});
    
    expect(sourceEditor.value).toContain('id="1ab"');
  });

  test('Text update on mixed content should NOT destroy siblings (reproduction of text patch bug)', () => {
    // Inject mixed content XML
    sourceEditor.value = `<root>
  MixedText
  <item id="1"><name>A</name></item>
</root>`;
    if (sourceEditor.oninput) sourceEditor.oninput({} as any);

    // Initial check: <item> exists
    expect(treeRoot.textContent).toContain("A");
    
    // Find a text node child of root containing "MixedText"
    const rootDiv = treeRoot.childNodes[0]; // <root> wrapper
    
    // Look for text node wrapper
    // It's a div.node containing span.text-node with "MixedText"
    const textNodeDiv = rootDiv.childNodes.find((n: any) => 
        n.tagName === "DIV" && 
        n.className.includes("node") &&
        n.childNodes.some((c: any) => c.className === "text-node" && c.textContent.includes("MixedText"))
    );
    
    if (!textNodeDiv) {
        const content = rootDiv.childNodes.map((n: any) => n.textContent).join("|");
        throw new Error(`Text node wrapper not found. Root content: ${content}`);
    }
    
    // Select it
    if (textNodeDiv.onclick) textNodeDiv.onclick({ stopPropagation: () => {} });
    
    // Prop editor "Data" input
    // h4 "Data", input
    const dataHeaderIndex = propEditor.childNodes.findIndex((n: any) => n.textContent === "Data");
    if (dataHeaderIndex === -1) throw new Error("Data header not found");
    
    const dataInput = propEditor.childNodes[dataHeaderIndex + 1];
    
    // Edit the text
    dataInput.value = "UpdatedText";
    if (dataInput.onchange) dataInput.onchange({});
    
    // Check if item is still there
    expect(sourceEditor.value).toContain("UpdatedText");
    expect(sourceEditor.value).toContain("<item"); // Fails if bug exists
  });

  test('Element text content update should update source (Ghost Update bug)', () => {
    // Select <name> element (not its text node, but the element itself)
    // <name>Apple</name>
    
    const rootDiv = treeRoot.childNodes[0];
    const itemNode = rootDiv.childNodes.find((n: any) => n.childNodes.some((c: any) => c.textContent === "item"));
    const nameNodeDiv = itemNode.childNodes.find((n: any) => n.childNodes.some((c: any) => c.textContent === "name"));
    
    if (!nameNodeDiv) throw new Error("Name node div not found");
    
    if (nameNodeDiv.onclick) nameNodeDiv.onclick({ stopPropagation: () => {} });
    
    // Prop editor "Text Content" input
    // This input is bound to el.textContent
    const textHeaderIndex = propEditor.childNodes.findIndex((n: any) => n.textContent === "Text Content");
    const textInput = propEditor.childNodes[textHeaderIndex + 1];
    
    // Edit to "UniqueFruit"
    textInput.value = "UniqueFruit";
    if (textInput.onchange) textInput.onchange({});
    
    // Check Source
    expect(sourceEditor.value).toContain("<name>UniqueFruit</name>");
  });
});
