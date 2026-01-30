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
