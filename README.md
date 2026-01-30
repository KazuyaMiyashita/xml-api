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

このプロジェクトは、以下の層構造になっています。

1.  **Parser Core**: 汎用的な構文解析エンジン (`parser.ts`, `grammar.ts`)
2.  **Grammar Definitions**: XML 文法の定義 (`xml-grammar.ts`)
3.  **API Layer**: 統合されたインターフェース (`xml-api.ts`)
4.  **High-Level AST**: アプリケーション向けの使いやすいデータ構造 (`xml-ast.ts`)

### ディレクトリ構成

```
.
├── src/
│   ├── main.ts                  # エントリーポイント。API使用デモ
│   ├── xml-api.ts               # 統合API (XMLAPI class)
│   ├── parser.ts                # パーサーコンビネータ・CST定義
│   ├── grammar.ts               # 文法管理 (Grammar class)
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
*   **Grammar**: ルール管理とパース実行のエントリーポイント。
*   **CST**: 生の構文木 (Concrete Syntax Tree) のノード。
*   **Combinators**: `seq` (順序), `alt` (選択), `rep` (繰り返し) などの基本機能を提供。

#### 2. Grammar Definitions
*   **`src/xml-grammar.ts`**: XML 1.0 仕様に基づいた詳細な定義。
*   **`src/minimum-grammar.ts`**: 基本的なタグ構造のみをサポートする軽量な定義。

#### 3. XML API (`src/xml-api.ts`)
CST, AST, 入力文字列、文法定義などをまとめて管理するクラス `XMLAPI` を提供します。
ユーザーはこのクラスを通じてパースや変換を行います。

#### 4. High-Level AST (`src/xml-ast.ts`)
パース結果の CST は文法構造を厳密に反映しているため、深くネストしており、アプリケーションからの利用は煩雑です。
`AST` クラスは、これをフラット化し、直感的に操作できるようにします。

*   **`tagName`**: タグ名
*   **`attributes`**: 属性の Key-Value オブジェクト
*   **`children`**: 子要素 (`AST`) またはテキスト (`string`) の配列
*   **メソッド**:
    *   `attr(name)`: 属性値の取得
    *   `text()`: 子孫のテキストノードを結合して取得
    *   `find(tagName)`: 指定したタグ名の要素を深さ優先探索で全て取得

---

## 🛠 開発ガイド

### 新しい文法への対応
1.  **Grammar**: `src/my-grammar.ts` を作成し、`grammar.ts` の `Grammar` クラスを使ってルールを定義します。
2.  **Converter**: `src/my-converter.ts` を作成し、CST から `AST` への変換ロジックを実装します。
3.  **Test**: テストで変換結果を検証します。

### AST の構造比較

**Raw CST (`CST`)**: 文法規則通りの深いネスト
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