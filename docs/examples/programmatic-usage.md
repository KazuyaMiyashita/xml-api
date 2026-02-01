# Programmatic Usage Guide

This guide demonstrates how to use the `xml-api` in your application logic. It covers everything from basic initialization to advanced bidirectional synchronization.

All examples below are fully functional. You can click the **Run (▶)** icon at the bottom right of each code block to see the actual execution result.

## Basic Initialization

To start using the API, initialize the `XMLAPI` class with your XML source string. This process parses the source and builds the internal CST, AST, and Model.

<CodeRunner scenario="basic-init" />

## Modifying via DOM Interface

The most intuitive way to update your XML is through the DOM-compatible interface. Standard methods like `setAttribute` and `textContent` automatically calculate minimal text patches for the source code, ensuring that formatting in unmodified areas remains intact.

<CodeRunner scenario="modifying-source" />

## Advanced Searching and Updates

You can perform complex searches using the `find` method and manipulate the source directly using `updateInput` for character-level precision.

<CodeRunner scenario="programmatic-usage" />

## Bidirectional Syncing Mechanism

This example simulates the core logic used in our interactive demo. It shows how changes in a "Virtual DOM" are captured by an observer and converted into source code patches using the `XMLBinder`.

### Key Concepts

1.  **Observer**: Monitors changes in the application state (e.g., a properties panel edit).
2.  **Binder**: The bridge that knows how to map logical nodes back to their exact locations in the source text.
3.  **Incremental Update**: Only the affected part of the source is modified, and the `XMLAPI` refreshes its internal state efficiently.

<CodeRunner scenario="demo-walkthrough" />

::: tip Note
For a visual demonstration of these concepts in action, visit the [Interactive Demo](./interactive-demo.md).
:::