# 指示内容

このセッションでは、 xml-grammer.ts に記載のXMLの文法が正しく記載されているかを念入りに確認し、
誤りの修正を行います。

---

## 主な指示内容

xml_spec.md にはXML仕様(Extensible Markup Language (XML) 1.0 (Fifth Edition)) をmarkdownに変換したファイルがあるので、 xml-grammer.ts と内容が合致するかを確認してください。このファイルは4000行あることに注意。

xml-grammer.ts では

```
// [2] Char
g.rule("Char", g.reg("\t|\n|\r|[\u0020-\uD7FF]|[\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF]"));
```

と記述がありますが、

xml_spec.md には

```
|  |  |  |  |  |
|----|----|----|----|----|
| <span id="NT-Char"></span>\[2\]    | `Char` |    ::=    | `#x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]` | */\* any Unicode character, excluding the surrogate blocks, FFFE, and FFFF. \*/* |
```

と記載があります。この記載を参考に、 xml-grammer.ts の該当箇所に

```
// [2] Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
// 
// any Unicode character, excluding the surrogate blocks, FFFE, and FFFF.
// 
// REF: xml_spec.md#char32 L480-L484 
g.rule("Char", g.reg("\t|\n|\r|[\u0020-\uD7FF]|[\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF]"));
```

のように説明を追記してください。

他にも、 [1] document では以下のように説明があるので、

```
|  |  |  |  |
|----|----|----|----|
| <span id="NT-document"></span>\[1\]    | `document` |    ::=    | ` `[`prolog`](#NT-prolog)` `[`element`](#NT-element)` `[`Misc`](#NT-Misc)`*` |

Matching the [document](#NT-document) production implies that:

1.  It contains one or more [elements](#dt-element "Element").

2.  \[<span id="dt-root">Definition</span>: There is exactly one
    element, called the **root**, or document element, no part of which
    appears in the [content](#dt-content "Content") of any other
    element.\] For all other elements, if the
    [start-tag](#dt-stag "Start-Tag") is in the content of another
    element, the [end-tag](#dt-etag "End Tag") is in the content of the
    same element. More simply stated, the elements, delimited by start-
    and end-tags, nest properly within each other.

\[<span id="dt-parentchild">Definition</span>: As a consequence of this,
for each non-root element `C` in the document, there is one other
element `P` in the document such that `C` is in the content of `P`, but
is not in the content of any other element that is in the content of
`P`. `P` is referred to as the **parent** of `C`, and `C` as a **child**
of `P`.\]
```

```
// [1] document ::= prolog element Misc*
//
// Summary:
// - Single Root Element: There is exactly one root element that contains all other elements within the document.
// - Proper Nesting: All elements must be correctly nested, with start and end tags forming non-overlapping, paired structures.
// - Clear Parent-Child Hierarchy: Every non-root element has exactly one parent, creating a well-defined tree structure.
// REF: xml_spec.md#char32 L480-L484 
g.rule("document", g.seq(g.ref("prolog"), g.ref("element"), g.rep(g.ref("Misc"))));
```

のように説明が多い部分は最大3行でサマリーを記載してください。

---

## テスト

誤りを発見し、プログラムを修正した場合、

- xml-grammer.test.ts に該当の部分のテストが存在するかを確認し、もしなければ追加する
- `pnpm test` によってテストが通ること

を行なってください。

## コミット

作業が完了し、テストが通った場合、現在のブランチ上で変更内容をコミットメッセージに日本語で含めてコミットをします。
ただし、mainブランチへのマージは行ってはいけません。

## その他の注意事項

カレントディレクトリの移動は行わないでください。この作業はワークツリー上で行われています。現在のディレクトリでできることのみを行なってください。作業したワークツリーの削除も行いません。

必要に応じて README.md の参照、更新を行なってください。
