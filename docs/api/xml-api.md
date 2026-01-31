# XMLAPI Class

The `XMLAPI` class is the central entry point for the library. It manages the parsing, model generation, and bidirectional synchronization between the source code and the application model.

## Constructor

```typescript
constructor(input: string, grammar?: Grammar, converter?: Converter)
```

Initializes the API with the source XML string.

- **input**: The initial XML source code.
- **grammar**: (Optional) Custom grammar definition.
- **converter**: (Optional) Custom CST-to-AST converter.

## Properties

- **input**: `string` - The current source code.
- **cst**: `CST | null` - The Concrete Syntax Tree.
- **ast**: `AST | null` - The Application Abstract Syntax Tree.
- **model**: `ModelElement | null` - The logical data model.

## Methods

### `updateInput`

```typescript
updateInput(from: number, to: number, value: string): void
```

Updates the source code by replacing the text range `[from, to)` with `value`. This triggers an incremental update of the CST, Model, and AST.

- **from**: Start index of the range to replace.
- **to**: End index of the range.
- **value**: The new text to insert.

### `setAttribute`

```typescript
setAttribute(astNode: AST, key: string, value: string): void
```

Sets an attribute on an AST node. This operation calculates the necessary patch for the source code and applies it via `updateInput`.

- **astNode**: The target AST node.
- **key**: Attribute name.
- **value**: Attribute value.

### `updateText`

```typescript
updateText(astNode: AST, text: string): void
```

Updates the text content of an AST element.

- **astNode**: The target AST element.
- **text**: The new text content.

### `replaceNode`

```typescript
replaceNode(astNode: AST | ASTComment | ASTCDATA, content: ASTNode): void
```

Replaces an AST node with new content.

- **astNode**: The node to be replaced.
- **content**: The new content (as an AST structure).

### `undo` / `redo`

```typescript
undo(): void
redo(): void
```

Performs undo or redo operations on the source code history.
