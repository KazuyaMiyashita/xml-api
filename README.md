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
│   ├── minimum-grammar.ts       # 簡易版の XML 文法定義 (実験用)
│   ├── xml-ast.ts               # 高レベル AST (class AST) の定義
│   ├── xml-converter.ts         # CST -> AST 変換
│   ├── minimum-converter.ts     # minimum-grammar CST -> AST 変換
│   ├── sample_01.xml            # 動作確認用のサンプルXML
│   └── *.test.ts                # 各種テストファイル
```

### コンポーネント詳細

#### 1. Parser Core (`src/parser.ts`, `src/grammar.ts`)
*   **Parser**: `Grammar` オブジェクトを受け取り、入力を解析して `CST` を生成します。実行エンジンに徹しており、文法の詳細を知りません。
*   **Grammar / GrammarBuilder**: 文法のルール（Expression）とバリデータを管理します。`GrammarBuilder` で構築した後に `build()` を呼び出すことで、イミュータブルな `Grammar` インスタンスを取得できます。
*   **Combinators**: `seq` (順序), `alt` (選択), `rep` (繰り返し) などのコンビネータを、トップレベルの関数として提供します。

#### 2. Grammar Definitions
*   **`src/xml-grammar.ts`**: XML 1.0 仕様に基づいた詳細な定義。
*   **`src/minimum-grammar.ts`**: 基本的なタグ構造のみをサポートする軽量な定義。

#### 3. XML API (`src/xml-api.ts`)
CST, AST, 入力文字列、文法定義などをまとめて管理するクラス `XMLAPI` を提供します。内部で `Parser` をインスタンス化して使用します。

#### 4. High-Level AST (`src/xml-ast.ts`)
パース結果の CST は文法構造を厳密に反映しているため、深くネストしており、アプリケーションからの利用は煩雑です。
`AST` クラスは、これをフラット化し、直感的に操作できるようにします。

## 🔄 差分更新 (Incremental Update)

`XMLAPI.update_input(from, to, value)` メソッドを通じて、CST（具体的な構文木）の部分的な更新をサポートしています。
これにより、テキスト変更のたびにCST全体を再構築することなく、高速かつ整合性のある更新が可能になります。

### 実装のアプローチ

以下の要件を満たすように設計・実装されています。

1.  **整合性の保証 (Consistency)**:
    *   部分更新後のCSTは、変更後のテキスト全体に対して新規に `new XMLAPI(text)` を行った場合と論理的に等価な構造を持ちます。
    *   **再帰的な再パース**: 変更箇所を含む最小のノードから開始し、再パースを試みます。構造変化（ノードの長さが変わる、マッチしなくなるなど）が発生した場合は、親ノードへと再帰的に範囲を広げて再パースを試行することで、整合性を維持します。

2.  **パフォーマンス (Performance)**:
    *   **`shift` による位置情報の更新**: テキストの挿入・削除に伴う後続ノードの位置情報（start, end）の更新は、ツリー走査による数値加算（`CST.shift`）のみで行い、不要なオブジェクト生成を防ぎます。
    *   **最小範囲の再構築**: 全文パースを回避し、変更の影響を受けたサブツリーのみを再作成して差し替えます。

3.  **CST構造の刷新**:
    *   部分更新を容易にするため、CSTノードに `name`（文法ルール名）と `type`（構造タイプ: `sequence`, `repeat` など）を分離して保持させました。
    *   これにより、パーサーは特定のルール名（例: `Attribute`）を指定して、任意の位置から部分的なパース（`parser.parseAt`）を実行できます。

4.  **Well-Formedness の維持**:
    *   更新後のツリーに対し、影響を受けたパス上のバリデータを再実行します（`validateAncestors`）。
    *   タグの不整合などが生じて `wellFormed` でなくなった場合でも、CST自体は破壊されず、`wellFormed: false` の状態で維持されます。これにより、エディタ等でエラー状態を可視化しつつ編集を継続することが可能です。