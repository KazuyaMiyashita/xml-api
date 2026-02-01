[**@miy2/xml-api**](../../../README.md)

***

# Type Alias: Validator()

> **Validator** = (`node`, `input`) => `boolean`

A function that performs semantic or contextual validation on a parsed CST node.

It is used to enforce rules that cannot be easily expressed by the grammar itself,
such as matching start and end tag names or ensuring attribute uniqueness.
If it returns false, the node's `wellFormed` flag is set to false, but the
parsing process continues.

## Parameters

### node

[`CST`](../../xml-cst/classes/CST.md)

### input

`string`

## Returns

`boolean`
