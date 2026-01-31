# Full Fidelity

One of the primary goals of this library is **Full Fidelity**. This means that automated edits must not alter any whitespace, indentation, or comments in parts of the code that are not explicitly modified.

## How it Works

The system achieves fidelity through the interaction of the CST and the XMLAPIModel. The CST captures the exact physical representation of the source, while the Model retains formatting rules derived from it.

### Scenarios

#### Fidelity & Formatting
The `Formatter` ensures that the generated XML maintains the original style of the source code. It respects existing indentation and newlines found in the AST. Alternatively, the application can request a forced re-format to apply a consistent style (e.g., changing 2-space indentation to 4-space) across the document.

#### Extended Structure Support
The library handles CDATA sections and Comments as distinct nodes in the AST, preserving their format during parsing and serialization. This allows applications to safely edit comments and raw text data without corruption.

#### Smart Formatting
The system automatically detects indentation style from the surrounding code when inserting new nodes. This "Context-Aware Formatting" ensures that automated edits blend seamlessly with the existing code style, respecting user preferences for tabs or spaces.
