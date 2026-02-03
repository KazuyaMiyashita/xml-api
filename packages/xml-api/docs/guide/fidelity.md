# Full Fidelity

One of the primary goals of this library is **Full Fidelity**. This means that automated edits must not alter any whitespace, indentation, or comments in parts of the code that are not explicitly modified.

## How it Works

The system achieves fidelity through the interaction of the **CST** and the **Model**. The CST captures the exact physical representation of the source, while the Model maintains the logical structure and coordinates synchronization.

### Scenarios

#### Fidelity & Formatting
When performing operations via the **DOM Interface**, the system calculates minimal text patches. This ensures that the generated XML maintains the original style of the source code, respecting existing indentation and newlines.

#### Structural Preservation
The library handles CDATA sections and Comments as distinct nodes in both the Model and the DOM Interface. This allows applications to safely edit comments and raw text data without corrupting the surrounding structure or losing formatting.

#### Context-Aware Formatting
When inserting new nodes (e.g., via `appendChild`), the system can detect the indentation style from the surrounding code. This ensures that automated edits blend seamlessly with the existing code style, respecting the project's preference for tabs or spaces.
