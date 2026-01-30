# XML API

TypeScript で実装された、パーサーコンビネータを用いた XMLパーサー・操作用のAPIです。
XML 仕様（Extensible Markup Language (XML) 1.0）に基づいた文法定義を持ち、サンプルの XML ファイルをパースして抽象構文木（AST）を出力します。

パース結果の生の構文木 (CST: Concrete Syntax Tree) を、より扱いやすい高レベル AST (`AST`) に変換する機能も提供しており、DOM のような直感的な操作が可能です。
これらの機能は統合された `XMLAPI` クラスを通じて利用できます。

## 🚀 クイックスタート

### 必須要件
* Node.js
* pnpm (推奨) または npm

### セットアップ
依存関係をインストールします。

```bash
pnpm install
```

### 実行
サンプルの XML ファイル (`src/sample_01.xml`) をパースし、**高レベル AST に変換した結果** をコンソールに出力します。

```bash
pnpm start
```

### テスト
ユニットテストおよびインテグレーションテストを実行します。

```bash
pnpm test
```

---

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

---

## 🛠 開発ガイド

### 新しい文法の定義方法
1.  `GrammarBuilder` インスタンスを作成します。
2.  `rule(name, expression)` メソッドでルールを定義します。トップレベルのコンビネータ（`seq`, `alt`, `reg`, `lit` 等）を組み合わせて使用します。
3.  必要に応じて `verifyRule(name, (node, input) => boolean)` で、パース後の追加検証（ウェルフォームドネスのチェック等）を登録します。
4.  `builder.build()` で `Grammar` インスタンスを生成し、`Parser` に渡します。

```typescript
import { GrammarBuilder, seq, lit, ref, plus, reg } from './grammar';
import { Parser } from './parser';

const gb = new GrammarBuilder();
gb.rule("Greeting", seq(lit("Hello, "), ref("Name"), lit("!")));
gb.rule("Name", plus(reg("[a-zA-Z]")));

const parser = new Parser(gb.build());
const cst = parser.parse("Hello, World!");
```

### AST の構造比較

**Raw CST (`CST`)**: 文法規則通りの深いネスト。自動的にルール名がノードの `type` に付与されます。
```typescript
{
  type: "element",
  children: [
    { type: "STag", children: [...] },
    { type: "content", children: [...] },
    { type: "ETag", children: [...] }
  ]
}
```

**High-Level AST (`AST`)**: シンプルなツリー
```typescript
{
  tagName: "div",
  attributes: { "id": "main" },
  children: [
    "Hello",
    { tagName: "span", ... }
  ]
}
```
