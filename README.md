# XML Parser Project

TypeScript で実装された、パーサーコンビネータを用いた XML パーサーです。
XML 仕様（Extensible Markup Language (XML) 1.0）に基づいた文法定義を持ち、サンプルの XML ファイルをパースして抽象構文木（AST）を出力します。

また、パース結果の生の構文木 (CST) を、より扱いやすい高レベル AST (`XMLElement`) に変換する機能も提供しており、DOM のような直感的な操作が可能です。

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
出力例:
```text
Reading XML file: .../src/sample_01.xml
Parsing XML...
Parsing successful. Converting to High-Level AST...
Conversion successful.
--------------------------------------------------
Root Element: <html>
Attribute 'xml:lang': ja

Searching for <title> elements...
Found title: りんごの選び方

Searching for <h2> elements (Section Headers)...
- はじめに
- 選定基準
--------------------------------------------------
```

### テスト
ユニットテストおよびインテグレーションテストを実行します。

```bash
pnpm test
```

---

## 🏗 アーキテクチャ

このプロジェクトは、以下の 3 層構造になっています。

1.  **Parser Combinator**: 汎用的な構文解析エンジン
2.  **Grammar Definitions**: XML 文法の定義 (CST を生成)
3.  **High-Level AST**: アプリケーション向けの使いやすいデータ構造

### ディレクトリ構成

```
.
├── src/
│   ├── main.ts                      # エントリーポイント。AST変換のデモを実行
│   ├── parser.ts                    # パーサーコンビネータ (Core)
│   ├── xml-grammar.ts               # XML 完全仕様に近い文法定義
│   ├── minimum-grammar.ts           # 簡易版の XML 文法定義 (実験用)
│   ├── xml-ast.ts                   # 高レベル AST (XMLElement) の定義
│   ├── xml-grammar-converter.ts     # xml-grammar CST -> High-Level AST 変換
│   ├── minimum-grammar-converter.ts # minimum-grammar CST -> High-Level AST 変換
│   ├── sample_01.xml                # 動作確認用のサンプルXML
│   └── *.test.ts                    # 各種テストファイル
```

### コンポーネント詳細

#### 1. Parser Combinator (`src/parser.ts`)
*   **Grammar**: ルール管理とパース実行。
*   **Expression (Node)**: 生の構文木 (CST) のノード。
*   **Combinators**: `seq` (順序), `alt` (選択), `rep` (繰り返し) などの基本機能を提供。

#### 2. Grammar Definitions
*   **`src/xml-grammar.ts`**: XML 1.0 仕様に基づいた詳細な定義。
*   **`src/minimum-grammar.ts`**: 基本的なタグ構造のみをサポートする軽量な定義。

#### 3. High-Level AST (`src/xml-ast.ts`)
パース結果の CST は文法構造を厳密に反映しているため、深くネストしており、アプリケーションからの利用は煩雑です。
`XMLElement` クラスは、これをフラット化し、直感的に操作できるようにします。

*   **`tagName`**: タグ名
*   **`attributes`**: 属性の Key-Value オブジェクト
*   **`children`**: 子要素 (`XMLElement`) またはテキスト (`string`) の配列
*   **メソッド**:
    *   `attr(name)`: 属性値の取得
    *   `text()`: 子孫のテキストノードを結合して取得
    *   `find(tagName)`: 指定したタグ名の要素を深さ優先探索で全て取得

---

## 🛠 開発ガイド

### 新しい文法への対応
1.  **Grammar**: `src/my-grammar.ts` を作成し、`parser.ts` を使ってルールを定義します。
2.  **Converter**: `src/my-grammar-converter.ts` を作成し、CST (`Node`) から `XMLElement` への変換ロジックを実装します。
3.  **Test**: `src/my-grammar-converter.test.ts` で変換結果を検証します。

### AST の構造比較

**Raw CST (`Node`)**: 文法規則通りの深いネスト
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

**High-Level AST (`XMLElement`)**: シンプルなツリー
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