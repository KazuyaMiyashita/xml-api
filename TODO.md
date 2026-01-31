# TODO List

## 🚀 Performance Optimization: Delayed Coordinate Update
Current Issue: `update_input` performs `CST.shift` (O(N)) immediately, which is heavy for large files.
Goal: Delay shifting until the incremental update is confirmed successful.

- [x] **Implement Coordinate Projection**:
    - Create a mechanism to calculate "projected" coordinates for nodes without modifying the actual CST.
    - Allow the parser/traverser to work with these projected coordinates during the trial phase of incremental parsing.
- [x] **Atomic `update_input` Transaction**:
    - Refactor `update_input` to use a "Transaction" concept.
    - The transaction should hold the pending change (from, to, text).
    - Only commit changes (apply shift and node replacement) to the main CST if the incremental parse succeeds.

## 🏗️ Architecture Evolution: Intermediate AST & Fidelity
Goal: Bridge the gap between the raw CST (formatting/whitespace rich) and the high-level AST (application logic).

- [x] **Design 3-Layer Structure (Potential)**:
    - **Application AST**: Pure data for the user (existing `AST` might evolve into this or stay as is).
    - **Intermediate/Mapped AST**: A structure managed by `XMLAPI` that holds both semantic data and links to `CST` (positions, formatting).
    - **CST**: Raw parse tree.
- [x] **Enhanced AST / Identity Mapping**:
    - Modify the AST (or implement the Intermediate layer) to hold position information or direct references to CST nodes.
    - **Constraint**: Must allow preserving original CST details (whitespace, indentation) when converting back or modifying.

## ⚡ AST Incremental Update
Current Issue: `update_input` regenerates the entire AST (`generateAST`) even for small changes.
Goal: Update only the affected parts of the AST/Intermediate layer.

- [x] **Differential Update Logic**:
    - Identify corresponding AST/Intermediate nodes from changed CST nodes.
    - Re-run conversion *only* on the affected subtree.
    - Update the existing AST structure in-place (splice).

## ✨ Formatter
Goal: Provide a way to format XML programmatically, potentially leveraging the CST/Intermediate structure.

- [ ] **Implement Formatter**:
    - Create a formatter that can output standard-compliant, pretty-printed XML.
    - Should likely support configuration (indent size, etc.).

## 🛠️ Infrastructure & Testing
- [ ] **Performance Benchmarks**: Add benchmarks for `update_input` with large files.
- [ ] **Transaction Tests**: Verify atomic updates.
- [ ] **Mapping & Fidelity Tests**: Ensure AST->CST modifications (if any) or updates don't lose unrelated whitespace.

## 🔮 Future: WYSIWYG & Bidirectional Sync
- [ ] **Atomic Operations**: Ensure reliable undo/redo.
- [ ] **Event System**: Notify listeners of changes.