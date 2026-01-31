# Basic Usage

## Initializing the API

```typescript
import { XMLAPI } from 'xml-api';

const xml = `<root>
  <item id="1">Value</item>
</root>`;

const api = new XMLAPI(xml);

if (api.ast) {
  console.log("Parse successful!");
} else {
  console.error("Parse failed.");
}
```

## Modifying Source

The primary way to modify the document programmatically while maintaining fidelity is through the `XMLAPI` methods.

```typescript
// Find the first 'item' node in AST
const itemNode = api.ast?.children.find(
  child => child.type === 'element' && child.tagName === 'item'
);

if (itemNode) {
  // Update attribute
  api.setAttribute(itemNode, 'status', 'active');
  
  // Update text content
  api.updateText(itemNode, 'New Value');
}

console.log(api.input);
// Output:
// <root>
//   <item id="1" status="active">New Value</item>
// </root>
```
