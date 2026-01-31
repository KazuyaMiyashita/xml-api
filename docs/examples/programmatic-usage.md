# Programmatic Usage

This example demonstrates how to use the `xml-api` programmatically in a Node.js environment or directly in logic. It covers parsing, searching, incremental updates, and AST manipulation.

## Source Code

The following code is a comprehensive example of the API's capabilities.

```typescript
// sample.xml
const xmlContent = `<book xml:lang="ja">
  <title>りんごの選び方</title>
  <section>
    <h2>選定基準</h2>
    <p>美味しいりんごを選ぶには...</p>
  </section>
  <section>
    <h2>保存方法</h2>
    <p>涼しい場所で...</p>
  </section>
</book>`;

// Initialize
const api = new XMLAPI(xmlContent);

// 1. Search
const titles = api.ast?.find("title");
console.log(`Found title: ${titles[0].text()}`);

// 2. Incremental Update
const targetText = "りんごの選び方";
const startPos = api.input.indexOf(targetText);
api.updateInput(startPos, startPos + targetText.length, "美味しいりんごの見分け方");

// 3. AST Manipulation
const sections = api.ast?.find("section");
// ... construct new AST ...
// api.replaceNode(targetSection, newSectionAst);
```

## Execution Result

Click the "Run Code" button below to execute the full logic in your browser.

<ClientOnly>
  <CodeRunner />
</ClientOnly>
