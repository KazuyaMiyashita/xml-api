[**xml-api**](../../../README.md)

***

# Variable: grammar

> `const` **grammar**: [`Grammar`](../../grammar/classes/Grammar.md)

Unimplemented Well-formedness Constraints (WFC)

The following constraints are currently not enforced by this parser.
Implementation would require an Entity Manager, DTD Processor, and extended Context.

- [WFC: PEs in Internal Subset]
  "In the internal DTD subset, parameter-entity references MUST NOT occur within markup declarations..."
  https://www.w3.org/TR/xml/#wfc-PEinInternalSubset

- [WFC: External Subset]
  "The external subset, if any, MUST match the production for extSubset."
  https://www.w3.org/TR/xml/#ExtSubset

- [WFC: PE Between Declarations]
  "The replacement text of a parameter entity reference in a DeclSep MUST match the production extSubsetDecl."
  https://www.w3.org/TR/xml/#PE-between-Decls

- [WFC: No External Entity References]
  "Attribute values MUST NOT contain direct or indirect entity references to external entities."
  https://www.w3.org/TR/xml/#NoExternalRefs

- [WFC: No < in Attribute Values]
  "The replacement text of any entity referred to directly or indirectly in an attribute value MUST NOT contain a <."
  https://www.w3.org/TR/xml/#CleanAttrVals

- [WFC: Entity Declared]
  "In a document without any DTD, a document with only an internal DTD subset which contains no parameter entity references, or a document with standalone='yes', for an entity reference that does not occur within the external subset or a parameter entity, the Name given in the entity reference MUST match that in an entity declaration..."
  https://www.w3.org/TR/xml/#wf-entdeclared

- [WFC: Parsed Entity]
  "An internal general parsed entity MUST match the production content."
  https://www.w3.org/TR/xml/#textent

- [WFC: No Recursion]
  "A parsed entity MUST NOT contain a recursive reference to itself, either directly or indirectly."
  https://www.w3.org/TR/xml/#norecursion

- [WFC: In DTD]
  "Parameter-entity references MUST NOT occur outside the DTD."
  https://www.w3.org/TR/xml/#indtd
