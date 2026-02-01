[**xml-api**](../../README.md)

***

# Type Alias: ChangeType

> **ChangeType** = `"structure"` \| `"attribute"` \| `"text"` \| `"full"`

The type of change that occurred in the model.
- `full`: A full re-parse or significant structural change occurred.
- `structure`: The structure (children) of a node changed.
- `attribute`: An attribute was added, removed, or changed.
- `text`: Text content changed.
