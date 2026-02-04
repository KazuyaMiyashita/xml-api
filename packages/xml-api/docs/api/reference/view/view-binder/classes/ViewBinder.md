[**@miy2/xml-api**](../../../README.md)

***

# Class: ViewBinder

Handles the logic of reconciling a SchemaView (filtered DOM) with an external source
(like a browser DOM in a contentEditable editor).

Its primary responsibility is to apply changes from the external source to the internal
SchemaView DOM without destroying data that the external source doesn't know about.

Key Feature: Preservation of "Invisible" Nodes.
If the Model contains "formatting whitespace" or other nodes that are present in the
internal view but "invisible" or collapsed in the external view, the ViewBinder
detects this and skips/preserves them instead of treating their absence as a deletion.

## Implements

- [`Reconciler`](../interfaces/Reconciler.md)

## Constructors

### Constructor

> **new ViewBinder**(`document`): `ViewBinder`

#### Parameters

##### document

[`Document`](../../../dom/classes/Document.md)

#### Returns

`ViewBinder`

## Methods

### reconcile()

> **reconcile**(`externalNode`, `internalElement`): `void`

Reconciles the internal element's children to match the external node's children.

#### Parameters

##### externalNode

[`ExternalNode`](../interfaces/ExternalNode.md)

##### internalElement

[`Element`](../../../dom/classes/Element.md)

#### Returns

`void`

#### Implementation of

[`Reconciler`](../interfaces/Reconciler.md).[`reconcile`](../interfaces/Reconciler.md#reconcile)
