[**@miy2/xml-api**](../../../README.md)

***

# Function: detectIndent()

> **detectIndent**(`node`, `source`): `string` \| `null`

Detects the indentation string preceding a CST node.
Scans backwards from the node's start position until a newline or non-whitespace character is found.

## Parameters

### node

[`CST`](../../xml-cst/classes/CST.md)

The CST node to analyze.

### source

`string`

The full source string.

## Returns

`string` \| `null`

The indentation string (e.g., "  ", "\t") if the node starts on a new line (or start of file).
         Returns null if the node follows non-whitespace content on the same line (inline).
