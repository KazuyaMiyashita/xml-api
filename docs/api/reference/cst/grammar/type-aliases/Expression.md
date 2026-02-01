[**@miy2/xml-api**](../../../README.md)

***

# Type Alias: Expression

> **Expression** = \{ `type`: `"Literal"`; `value`: `string`; \} \| \{ `pattern`: `string`; `type`: `"RegExpMatch"`; \} \| \{ `expressions`: `Expression`[]; `type`: `"Sequence"`; \} \| \{ `expressions`: `Expression`[]; `type`: `"Choice"`; \} \| \{ `expression`: `Expression`; `max`: `number`; `min`: `number`; `type`: `"Repeat"`; \} \| \{ `a`: `Expression`; `b`: `Expression`; `type`: `"Exclusion"`; \} \| \{ `name`: `string`; `type`: `"Reference"`; \}

Fundamental building blocks of the grammar.
These can be combined to represent various syntax structures equivalent to EBNF.

## Type Declaration

\{ `type`: `"Literal"`; `value`: `string`; \}

### type

> **type**: `"Literal"`

### value

> **value**: `string`

Matches a specific exact string.

\{ `pattern`: `string`; `type`: `"RegExpMatch"`; \}

### pattern

> **pattern**: `string`

### type

> **type**: `"RegExpMatch"`

Matches a regular expression pattern.

\{ `expressions`: `Expression`[]; `type`: `"Sequence"`; \}

### expressions

> **expressions**: `Expression`[]

### type

> **type**: `"Sequence"`

Matches multiple expressions in order (AND).

\{ `expressions`: `Expression`[]; `type`: `"Choice"`; \}

### expressions

> **expressions**: `Expression`[]

### type

> **type**: `"Choice"`

Matches any one of the provided expressions (OR).

\{ `expression`: `Expression`; `max`: `number`; `min`: `number`; `type`: `"Repeat"`; \}

### expression

> **expression**: `Expression`

### max

> **max**: `number`

### min

> **min**: `number`

### type

> **type**: `"Repeat"`

Matches an expression repeated a specified number of times.

\{ `a`: `Expression`; `b`: `Expression`; `type`: `"Exclusion"`; \}

### a

> **a**: `Expression`

### b

> **b**: `Expression`

### type

> **type**: `"Exclusion"`

Matches expression A, provided that expression B does not match (negation/exclusion).

\{ `name`: `string`; `type`: `"Reference"`; \}

### name

> **name**: `string`

### type

> **type**: `"Reference"`

Invokes another named rule (used for recursive definitions).
