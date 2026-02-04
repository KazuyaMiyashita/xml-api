# Project Roadmap & Challenges

## Workflow
This project follows an iterative cycle:
1. Implement features in `xml-api-editor`.
2. Identify limitations, bugs, or architectural issues in `@miy2/xml-api`.
3. Fix/Improve `@miy2/xml-api`.
4. Update `xml-api-editor` to use the new library version.

## Key Challenges to Address

### 1. Schema & Document Type Identification
**Context:** The editor currently assumes a subset of HTML5/XHTML.
**Issue:** How should the editor (and the library) determine the type of XML document being edited?
- Does `xml-api` need to handle schema detection?
- How do we switch renderer/editor modes based on the root element or namespace?

### 2. Transaction Synchronization & User State
**Context:** Bi-directional syncing relies on observing transactions.
**Issue:** When `xml-api` updates the model/DOM, the editor's internal state (specifically **cursor position**, **text selection**, and **scroll position**) might be reset or lost.
- **Requirement:** Define a clear boundary between the library's state (XML structure) and the application's state (User Interface).
- **Task:** Implement a mechanism to preserve user focus and selection during external updates.

### 3. Mixed Namespace & Partial Updates (Future Prep)
**Context:** The next iteration of this project involves embedding MEI (Music Encoding Initiative) XML within XHTML and rendering it using Verovio (SVG generation).
**Issue:**
- **Namespace Delegation:** We need a strategy to delegate rendering and editing logic based on XML namespaces.
- **Performance:** Updating the specific DOM subtree (e.g., the score) without re-rendering the entire document.
- **Goal:** Prove that `xml-api` allows for granular, namespace-aware updates suitable for complex embeddings like MEI.

## Implementation Tasks

### Phase 1: Foundation
- [x] Setup Basic Split-Pane UI
- [x] Load initial XML via `XMLAPI`
- [x] Implement Code Editor (Custom contenteditable) with `onChange` binding to `XMLAPI`.
- [x] Implement Basic WYSIWYG Renderer (Render `xml-api` DOM to React).

### Phase 2: Synchronization Validation
- [x] Implement DOM mutation observation (WYSIWYG changes -> `xml-api` updates).
- [x] Implement Source updates reflection (Code changes -> WYSIWYG re-render).
- [x] **Incremental Update**: Avoid full tree re-renders/updates. Implement differential updates for both CodeEditor and WYSIWYGEditor.
- [x] **Thorough Testing**: Ensure incremental updates work correctly with extensive E2E tests for both editors.
- [x] **Challenge #2**: Solve the "Cursor Jump" / Focus loss problem during sync.

### Phase 2.5: Bug Fixes & Improvements
- [x] **Bug Fix (1): Sync Failure**: Fixed by using `api.updateSource` and improving internal update detection.
- [x] **Bug Fix (2): Input Duplication**: Fixed by manually managing `innerHTML` in CodeEditor and skipping redundant updates.
- [x] **Bug Fix (3): DOM Error**: Stability achieved via incremental updates and better VDOM/Native synchronization.
- [x] **Feature Fix**: Ensure `<strong>` tag renders correctly in WYSIWYG Editor.
- [x] **Investigation**: E2E tests (Playwright) fully implemented and verified for all phases.

### Phase 2.6: Editor Modernization (Library Integration)
- [x] **Refactor CodeEditor**: Replace custom `contenteditable` with `CodeMirror` (Raw mode).
    - **Strategy**: Do not use CodeMirror's language support. Use `xml-api` CST to generate syntax highlighting and manage structure.
- [x] **Refactor WYSIWYGEditor**: Replace manual React rendering with `ProseMirror`.
    - **Strategy**: Use `ProseMirror` strictly for the View layer (selection, input handling).
    - **Constraint**: `xml-api` remains the source of truth (Model). Syncing should flow `ProseMirror View -> xml-api Model -> ProseMirror View` (or via efficient diffing).
- [x] **Verify Synchronization Logic**: Ensure that bi-directional synchronization and incremental updates still work correctly after refactoring both editors.

### Phase 3: Advanced Features & Namespace Handling
- [x] **Fix Serialization/Schema Issues**: Address the bug where ProseMirror serialization adds unwanted classes (e.g., `wysiwyg-section`) and destroys XML formatting/whitespace. This requires a robust schema-aware serialization strategy in `xml-api` or the editor adapter.
- [x] **Define XHTML5 Subset**: Strictly define the supported elements (e.g., `section`, `h1`-`h6`, `p`) and attributes.
- [x] **Schema Support in xml-api**: Identify requirements for `xml-api` to distinguish between supported/editable nodes and raw/unsupported nodes based on the defined subset. Submit these as feature requests/issues to `xml-api`.
- [x] Prototype logic for detecting XML types/namespaces (Challenge #1).
- [x] Prototype separate rendering strategies for different namespaces (Challenge #3).

### Phase 4: Finalization
- [x] **Implementation Review**: Re-verify all implemented features against requirements.
- [x] **Implementation Report**: Create a detailed report summarizing the architecture, validation results, known limitations (waiting for library fixes), and future recommendations. This marks the completion of the `xml-api-editor` validation project.

### Phase 5: Quality & Stability (Current)
- [ ] **Fix Excess Logging**: Reduce the number of "Full update" logs at startup (currently ~8).
- [ ] **Fix CodeEditor Sync Issues**:
    - [ ] Solve the "Enter key inserts space/doesn't break line" issue.
    - [ ] Fix cursor jumping to start after edits.
    - [ ] Fix incorrect syntax highlighting/CST sync lag.
    - [ ] Prevent unwanted tag auto-completion/modification (e.g., `<` -> `<p>&gt;</p>`).
- [ ] **Strict Raw Mode & Error Handling**:
    - [ ] Ensure `CodeEditor` is the source of truth ("Raw" mode).
    - [ ] Disable automatic model repair for non-well-formed XML.
    - [ ] **WYSIWYG Behavior**: If XML is not well-formed, show an error state instead of attempting to render a broken model.
- [ ] **Testing**:
    - [ ] Add reproduction tests for CodeEditor input quirks.
    - [ ] Add tests for invalid XML handling in WYSIWYG.
