# Changelog

## [0.9.1] - 2026-02-04

Significant architectural overhaul to introduce the Three-Level Reconciliation Pipeline and Schema Projection, addressing manual synchronization fragility and providing robust support for domain-specific editors.

### Added

- Schema Projection Layer: Introduced `SchemaView` to provide filtered, schema-specific document views while maintaining the full-fidelity of the original source in the background.
- Three-Level Reconciliation Pipeline: Formalized the synchronization architecture into three distinct layers: Source <-> CST (Incremental Parsing), CST <-> Model (Identity Preservation), and Model <-> View (Projection & Filtering).
- View-Scoped Events: Implemented a dedicated event system for `SchemaView` that emits projected mutation records (added/removed nodes) filtered by schema rules.
- Invisible Node Preservation: Added a `reconcile` method to `SchemaView` that allows syncing from external DOM trees while preserving "invisible" nodes (e.g., comments) in the underlying Model.
- Transaction Metadata: Added support for arbitrary metadata and origin tracking (`isRemote`, `setMeta`) in `Transaction` to improve bi-directional sync and ignore-self logic.
- Formatting Preservation: Introduced infrastructure for capturing and maintaining indentation hints in the Model to support non-destructive updates.

### Changed

- XMLAPI Core: Reorganized the core class to act as the orchestrator for the three-level reconciliation pipeline.
- Event System: Enhanced the internal `EventEmitter` to support transaction propagation and improved change tracking.

### Removed

- Deprecated Aliases: Removed `input` getter and `updateInput` method from `XMLAPI` class.
- Legacy Operations: Removed direct model manipulation methods (`setAttribute`, `updateText`, `replaceNode`) from `XMLAPI` in favor of DOM and `SchemaView` interfaces.
- Public Formatter API: Removed `Formatter` from public exports as formatting is now handled implicitly by the synchronization engine.

## [0.9.0] - 2026-02-01

### Added

- SyncEngine: Core engine for managing transaction processing, history, and event dispatching.
- CST / Incremental Parsing: W3C XML 1.0 compliant incremental parser that preserves full source fidelity, including whitespace and comments.
- Logical Model: Authoritative data model with persistent identity and efficient reconciliation between CST and application state.
- DOM Interface: W3C-like wrapper interfaces (`Document`, `Element`) for intuitive programmatic interaction.
- Transaction & History: Robust state management with Undo/Redo capabilities based on immutable `EditorState`.

