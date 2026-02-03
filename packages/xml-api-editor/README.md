# XML API Editor

A React-based XML editor application designed to validate and demonstrate the capabilities of the `@miy2/xml-api` library.

## Project Purpose & Goals

The primary purpose of this project is to serve as a **validation environment** for the `@miy2/xml-api` library, which aims to faithfully synchronize XML source code with its DOM representation.

### The Goal
The project is considered complete when we can demonstrate accurate, real-time, **bi-directional synchronization** between a Code Editor and a WYSIWYG Editor using `xml-api` as the mediator.

### Scope & Methodology
1.  **Validation:** Verify that DOM-level operations (WYSIWYG) and Source Code-level operations (Text Editor) synchronize correctly without data corruption or loss.
2.  **Iterative Improvement ("Dogfooding"):** We will develop this editor to identify bugs, missing features, and architectural flaws in `xml-api`. Issues found here will be fixed in the `xml-api` repository.
3.  **Foundation for Future Work:** This editor establishes the architectural pattern for handling mixed-namespace XML documents. Specifically, it lays the groundwork for a future project that will embed **MEI (Music Encoding Initiative)** data within XHTML documents, requiring seamless integration with tools like Verovio.

## Technical Requirements

- **Bi-directional Synchronization**: Changes made in the WYSIWYG editor should reflect in the code editor, and raw text changes must update the WYSIWYG view.
- **Split-pane Layout**: A two-panel interface (WYSIWYG vs. Code).
- **Library Integration**: Uses `@miy2/xml-api` for the core sync engine.
- **Robustness**: The system must handle rapid updates and complex XML structures without breaking the transaction state.
- **Schema Strictness**: The editor will operate on a **strictly defined subset of XHTML5**. We must define exactly which elements (e.g., `section`, `p`, `h1`) and attributes are supported. The system needs to distinguish between "supported" content (editable via WYSIWYG) and "unsupported" content (handled as raw XML or read-only blocks), potentially requiring new features in `xml-api`.
- **WYSIWYG Scope & Rendering**:
    - The WYSIWYG editor focuses on editing the content within the `<body>` tag and the `<title>` tag. The root `<html>` structure is managed transparently.
    - To maintain control and avoid browser-specific behavior anomalies, supported tags (e.g., `h1`, `p`) are rendered as styled `<div>` or `<span>` elements (simulating the appearance) rather than native HTML elements.
    - Unsupported tags are rendered as generic blocks.

## Technology Stack

- **Frontend Framework**: React
- **Build Tool**: Vite
- **Language**: TypeScript
- **XML Engine**: `@miy2/xml-api`

## Development

### Setup

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

### Build

```bash
pnpm run build
```