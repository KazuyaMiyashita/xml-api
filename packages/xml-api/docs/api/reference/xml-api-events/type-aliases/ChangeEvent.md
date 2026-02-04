[**@miy2/xml-api**](../../README.md)

***

# Type Alias: ChangeEvent

> **ChangeEvent** = \{ `target?`: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md); `transaction?`: [`Transaction`](../../engine/transaction/classes/Transaction.md); `type`: `"full"`; \} \| \{ `addedNodes?`: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)[]; `nextSibling?`: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md) \| `null`; `previousSibling?`: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md) \| `null`; `removedNodes?`: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)[]; `target`: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md); `transaction?`: [`Transaction`](../../engine/transaction/classes/Transaction.md); `type`: `"structure"`; \} \| \{ `key`: `string`; `newValue`: `string` \| `null`; `target`: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md); `transaction?`: [`Transaction`](../../engine/transaction/classes/Transaction.md); `type`: `"attribute"`; \} \| \{ `newValue?`: `string`; `target`: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md); `transaction?`: [`Transaction`](../../engine/transaction/classes/Transaction.md); `type`: `"text"`; \}

Event object emitted when the XML model changes.
