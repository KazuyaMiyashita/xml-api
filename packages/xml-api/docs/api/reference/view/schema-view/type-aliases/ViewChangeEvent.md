[**@miy2/xml-api**](../../../README.md)

***

# Type Alias: ViewChangeEvent

> **ViewChangeEvent** = \{ `target?`: [`Node`](../../../dom/classes/Node.md); `transaction?`: [`Transaction`](../../../engine/transaction/classes/Transaction.md); `type`: `"full"`; \} \| \{ `target`: [`Node`](../../../dom/classes/Node.md); `transaction?`: [`Transaction`](../../../engine/transaction/classes/Transaction.md); `type`: `"structure"`; \} \| \{ `key`: `string`; `newValue`: `string` \| `null`; `target`: [`Node`](../../../dom/classes/Node.md); `transaction?`: [`Transaction`](../../../engine/transaction/classes/Transaction.md); `type`: `"attribute"`; \} \| \{ `newValue?`: `string`; `target`: [`Node`](../../../dom/classes/Node.md); `transaction?`: [`Transaction`](../../../engine/transaction/classes/Transaction.md); `type`: `"text"`; \}
