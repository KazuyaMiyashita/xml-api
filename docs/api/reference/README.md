**xml-api**

***

# xml-api

# XML API Reference

This package provides a foundational API for parsing, manipulating, and synchronizing XML documents with high fidelity.
It is designed for WYSIWYG editors and IDEs that require bidirectional synchronization between the source code and the application model.

## Key Components

- [XMLAPI](classes/XMLAPI.md): The central entry point. Manages the source code, parsing, and bidirectional updates.
- [AST](classes/AST.md): The high-level Abstract Syntax Tree used for easy traversal and data extraction.
- [XMLBinder](classes/XMLBinder.md): Handles the logic for calculating minimal text patches to update the source code based on model changes.

## Core Features

- **Incremental Updates**: Update the source code efficiently using [XMLAPI.updateInput](classes/XMLAPI.md#updateinput).
- **AST Manipulation**: Modify the document structure using high-level methods like [XMLAPI.setAttribute](classes/XMLAPI.md#setattribute), [XMLAPI.updateText](classes/XMLAPI.md#updatetext), and [XMLAPI.replaceNode](classes/XMLAPI.md#replacenode).
- **History Management**: Built-in support for [XMLAPI.undo](classes/XMLAPI.md#undo) and [XMLAPI.redo](classes/XMLAPI.md#redo).

## Enumerations

- [ModelNodeType](enumerations/ModelNodeType.md)

## Classes

- [AST](classes/AST.md)
- [ASTCDATA](classes/ASTCDATA.md)
- [ASTComment](classes/ASTComment.md)
- [CDATASection](classes/CDATASection.md)
- [CharacterData](classes/CharacterData.md)
- [Comment](classes/Comment.md)
- [Document](classes/Document.md)
- [Element](classes/Element.md)
- [Formatter](classes/Formatter.md)
- [ModelCDATA](classes/ModelCDATA.md)
- [ModelComment](classes/ModelComment.md)
- [ModelElement](classes/ModelElement.md)
- [ModelNode](classes/ModelNode.md)
- [ModelText](classes/ModelText.md)
- [Node](classes/Node.md)
- [NodeList](classes/NodeList.md)
- [Text](classes/Text.md)
- [XMLAPI](classes/XMLAPI.md)
- [XMLBinder](classes/XMLBinder.md)

## Interfaces

- [DOMObserver](interfaces/DOMObserver.md)
- [FormatterOptions](interfaces/FormatterOptions.md)

## Type Aliases

- [ASTNode](type-aliases/ASTNode.md)
- [Converter](type-aliases/Converter.md)
- [NodeId](type-aliases/NodeId.md)

## Functions

- [createWrapper](functions/createWrapper.md)
