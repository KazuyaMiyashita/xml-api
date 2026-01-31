# XML API

TypeScript で実装された、パーサーコンビネータを用いた XMLパーサー・操作用のAPIです。
XML 仕様（Extensible Markup Language (XML) 1.0）に基づいた文法定義を持ち、サンプルの XML ファイルをパースして抽象構文木（AST）を出力します。

パース結果の生の構文木 (CST: Concrete Syntax Tree) を、より扱いやすい高レベル AST (`AST`) に変換する機能も提供しており、DOM のような直感的な操作が可能です。
これらの機能は統合された `XMLAPI` クラスを通じて利用できます。

## 🏗 アーキテクチャ

このプロジェクトは、以下の層構造になっています。

1.  **Parser Core**: 構文解析エンジン (`parser.ts`) と文法管理 (`grammar.ts`)
2.  **Grammar Definitions**: XML 文法の定義 (`xml-grammar.ts`)
3.  **CST Definitions**: 生の構文木定義 (`xml-cst.ts`)
4.  **API Layer**: 統合されたインターフェース (`xml-api.ts`)
5.  **High-Level AST**: アプリケーション向けの使いやすいデータ構造 (`xml-ast.ts`)
6.  **Formatting Layer**: AST から XML 文字列への整形出力 (`formatter.ts`)

### ディレクトリ構成

```
.
├── src/
│   ├── main.ts                  # エントリーポイント。API使用デモ
│   ├── xml-api.ts               # 統合API (XMLAPI class)
│   ├── parser.ts                # パース実行エンジン (Parser class)
│   ├── grammar.ts               # 文法データ構造・構築 (Grammar/GrammarBuilder)
│   ├── xml-cst.ts               # 生の構文木 (CST class) の定義
│   ├── xml-grammar.ts           # XML 完全仕様に近い文法定義
│   ├── xml-ast.ts               # 高レベル AST (class AST) の定義
│   ├── xml-converter.ts         # CST -> AST 変換
│   ├── formatter.ts             # AST -> XML 文字列変換 (Pretty Print)
│   └── *.test.ts                # 各種テストファイル
```

## 🔄 差分更新 (Incremental Update)

`XMLAPI.update_input(from, to, value)` メソッドを通じて、テキストの変更を CST および AST の両方に高速に反映する「増分更新」をサポートしています。

### 実装のアプローチ

1.  **アトミックなトランザクション (Atomic Update)**:
    *   再パースの試行中、既存の CST 座標は変更されません。
    *   最小の有効な再パース範囲が特定され、整合性が確認された瞬間にのみ、既存のツリーに対して座標シフト（`CST.shift`）とノードの差し替えが適用されます。これにより、パース失敗時に不整合な状態が残るのを防ぎます。

2.  **AST のインプレース更新 (Differential Update)**:
    *   CST の更新に連動して、AST の該当部分のみを再変換し、既存の AST オブジェクトをインプレースで更新します。
    *   変更の影響を受けていない祖先ノードや兄弟ノードの AST オブジェクトは維持（Identity Preservation）されるため、UI フレームワーク等との連携において不要な再レンダリングを抑えることが可能です。

3.  **Enhanced AST (CST Mapping)**:
    *   各 `AST` ノードは、自身を生成した元の `CST` ノードへの参照 (`ast.cst`) を保持しています。
    *   これにより、高レベルな操作を行いつつ、必要に応じて元のテキスト上の位置情報の取得や、生の構文構造へのアクセスが容易になります。

4.  **Well-Formedness の維持**:
    *   更新後のツリーに対し、影響を受けたパス上のバリデータを再実行します。
    *   タグの不整合などが生じて `wellFormed: false` になった場合、整合性を保つため `api.ast` は `null` になりますが、CST 自体は編集を継続できるよう維持されます。

## ✨ フォーマッター (Formatter)

`Formatter` クラスを使用することで、AST から整形された XML 文字列を出力できます。
*   **スマートインデント**: 子要素の構成（テキストを含むか、要素のみか）を自動判別し、適切に改行とインデントを挿入します。
*   **エスケープ処理**: テキストおよび属性値内の特殊文字（`<`, `>`, `&`, `"`）を自動的にエンコードします。
