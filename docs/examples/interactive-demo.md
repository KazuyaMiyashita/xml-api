# Interactive Demo

This interactive demo showcases the **Full Fidelity** editing capabilities of the XML API.

- **Source Code**: The raw XML text.
- **Visual DOM**: A DOM-like tree view of the parsed model.
- **Properties**: An editor to manipulate attributes and text content.

Try selecting a node in the Visual DOM and editing its properties. Notice how the source code updates instantly while preserving comments and original formatting. Conversely, edit the source code directly, and the tree updates automatically.

<ClientOnly>
  <XmlApiDemo />
</ClientOnly>

## How it works

This demo runs entirely in your browser. It uses the `XMLAPI` to parse the source string into a CST, which is then bound to a logical Model, and finally projected into a DOM-like interface for rendering.

See the [Demo Walkthrough](/examples/demo-walkthrough) for a code-level explanation.
