import { XMLAPI } from '@/xml-api';
import { AST } from '@/ast/xml-ast';
import { ModelElement } from '@/model/xml-api-model';
import { XMLBinder } from '@/model/xml-binder';

export interface Scenario {
  title: string;
  code: string;
  run: (log: (msg: string) => void) => void | Promise<void>;
}

export const scenarios: Record<string, Scenario> = {
  'basic-init': {
    title: 'Initializing the API',
    code: `import { XMLAPI } from 'xml-api';

const xml = \`<root>
  <item id="1">Value</item>
</root>\`;

const api = new XMLAPI(xml);

if (api.model) {
  console.log("Parse successful!");
  console.log(\`Root tag: <\${api.model.tagName}>\`);
} else {
  console.error("Parse failed.");
}`,
    run: (log) => {
      const xml = `<root>
  <item id="1">Value</item>
</root>`;
      const api = new XMLAPI(xml);
      if (api.model) {
        log("Parse successful!");
        log(`Root tag: <${api.model.tagName}>`);
      } else {
        log("Parse failed.");
      }
    }
  },

  'modifying-source': {
    title: 'Modifying via DOM Interface',
    code: `// Get a DOM-compatible Document object
const doc = api.getDocument();

// Find the item element
const item = doc.querySelector('item');

if (item) {
  // Update attribute using standard DOM method
  console.log("Setting attribute 'status' to 'active'...");
  item.setAttribute('status', 'active');
  
  // Update text content
  console.log("Updating text content to 'New Value'...");
  item.textContent = 'New Value';
}

console.log("Updated Source:");
console.log(api.input);`,
    run: (log) => {
      const xml = `<root>
  <item id="1">Value</item>
</root>`;
      const api = new XMLAPI(xml);
      const doc = api.getDocument();
      
      const item = doc.querySelector('item');

      if (item) {
        log("Setting attribute 'status' to 'active'...");
        item.setAttribute('status', 'active');
        
        log("Updating text content to 'New Value'...");
        item.textContent = 'New Value';
      }

      log("Updated Source:");
      log(api.input);
    }
  },

  'programmatic-usage': {
    title: 'Programmatic Search & Update',
    code: `const xmlContent = \`<book xml:lang="ja">
  <title>りんごの選び方</title>
  <section>
    <h2>選定基準</h2>
    <p>美味しいりんごを選ぶには...</p>
  </section>
</book>\`;

const api = new XMLAPI(xmlContent);

// 1. Search
const titles = api.ast?.find("title") || [];
if (titles.length > 0) {
  console.log(\`Found title: \${titles[0].text()}\`);
}

// 2. Incremental Update (Source manipulation)
const targetText = "りんごの選び方";
const startPos = api.input.indexOf(targetText);
if (startPos !== -1) {
  console.log(\`Replacing "\${targetText}" with "美味しいりんごの見分け方"...\`);
  api.updateInput(startPos, startPos + targetText.length, "美味しいりんごの見分け方");
}

console.log("Updated Title in AST:");
const newTitles = api.ast?.find("title") || [];
if (newTitles.length > 0) {
  console.log(newTitles[0].text());
}`,
    run: (log) => {
      const xmlContent = `<book xml:lang="ja">
  <title>りんごの選び方</title>
  <section>
    <h2>選定基準</h2>
    <p>美味しいりんごを選ぶには...</p>
  </section>
</book>`;

      const api = new XMLAPI(xmlContent);

      const titles = api.ast?.find("title") || [];
      if (titles.length > 0) {
        log(`Found title: ${titles[0].text()}`);
      }

      const targetText = "りんごの選び方";
      const startPos = api.input.indexOf(targetText);
      if (startPos !== -1) {
        log(`Replacing "${targetText}" with "美味しいりんごの見分け方"...`);
        api.updateInput(startPos, startPos + targetText.length, "美味しいりんごの見分け方");
      }

      log("Updated Title in AST:");
      const newTitles = api.ast?.find("title") || [];
      if (newTitles.length > 0) {
        log(newTitles[0].text());
      }
    }
  },
  
  'demo-walkthrough': {
    title: 'Bidirectional Sync Simulation',
    code: `import { XMLAPI } from 'xml-api';
import { XMLBinder } from 'xml-api/model/xml-binder';
import { ModelElement } from 'xml-api/model/xml-api-model';

// Simulation of the Observer Pattern used in the demo
const input = \`<button class="btn">Click me</button>\`;
const api = new XMLAPI(input);
const binder = new XMLBinder(input);

// Assume we have a model and a "Virtual DOM" element
const model = api.model as ModelElement; // Root element

console.log("Initial Source:", api.input);

// 1. Simulate User Action (Property Change)
const newValue = "btn btn-primary";
console.log(\`\\n[User Action] Changing 'class' attribute to '\${newValue}'\`);

// 2. Calculate Patch (Binder)
const patch = binder.calcSetAttributePatch(model, "class", newValue);

// 3. Apply Patch
if (patch) {
  console.log(\`[Patch Calculated] \${patch.text} at index \${patch.start}\`);
  api.updateInput(patch.start, patch.end, patch.text);
}

console.log("Updated Source:", api.input);

// 4. Verify AST Update
const newClass = api.ast?.attr("class");
console.log(\`Updated AST Attribute: class="\${newClass}"\`);`,
    run: (log) => {
      const input = `<button class="btn">Click me</button>`;
      const api = new XMLAPI(input);
      // Note: XMLAPI internally creates a binder if default converter is used.
      // We can access it implicitly via operations or create a separate one for demo logic if needed,
      // but api.setAttribute uses the internal binder.
      // Here we simulate the logic manually as per the explanation.
      
      // Accessing internal binder requires casting or using public API.
      // For this demo, we'll use a fresh binder to demonstrate the calculation logic
      const binder = new XMLBinder(input);
      const model = api.model as ModelElement;

      log("Initial Source: " + api.input);

      const newValue = "btn btn-primary";
      log(`
[User Action] Changing 'class' attribute to '${newValue}'`);

      const patch = binder.calcSetAttributePatch(model, "class", newValue);

      if (patch) {
        log(`[Patch Calculated] "${patch.text}" at index ${patch.start}`);
        api.updateInput(patch.start, patch.end, patch.text);
      }

      log("Updated Source: " + api.input);

      const newClass = api.ast?.attr("class");
      log(`Updated AST Attribute: class="${newClass}"`);
    }
  }
};
