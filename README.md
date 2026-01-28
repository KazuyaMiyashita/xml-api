# XML Parser Project

TypeScript で実装された、パーサーコンビネータを用いた XML パーサーです。
XML 仕様（Extensible Markup Language (XML) 1.0）に基づいた文法定義を持ち、サンプルの XML ファイルをパースして抽象構文木（AST）を出力します。

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
サンプルの XML ファイル (`src/sample_01.xml`) をパースし、結果をコンソールに出力します。

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

このプロジェクトは、汎用的なパーサーコンビネータと、それを用いた XML 文法定義の 2 層構造になっています。

### ディレクトリ構成

```
.
├── src/
│   ├── main.ts            # エントリーポイント。実行と結果出力を行う
│   ├── parser.ts          # パーサーコンビネータのコア実装 (Lexer/Parser機能)
│   ├── xml-grammar.ts     # XMLの文法定義 (parser.ts を使用してルールを構築)
│   ├── sample_01.xml      # 動作確認用のサンプルXML
│   └── *.test.ts          # 各種テストファイル
├── package.json
├── tsconfig.json
└── jest.config.js
```

### コアコンポーネント

1.  **`src/parser.ts` (Parser Combinator)**
    *   **Grammar**: ルールを管理し、パースを実行するクラス。
    *   **Expression (Node)**: 構文木のノード。
    *   **Combinators**:
        *   `lit`: リテラル文字列とのマッチ
        *   `reg`: 正規表現とのマッチ
        *   `seq`: 順番通りのマッチ (Sequence)
        *   `alt`: いずれかとのマッチ (Choice/Alternative)
        *   `rep`/`plus`/`opt`: 繰り返しと省略可能 (0回以上, 1回以上, 0or1回)
        *   `exc`: 除外 (Exclusion) - あるパターンにマッチしないことを確認
        *   `ref`: 他のルールへの参照 (Reference)

2.  **`src/xml-grammar.ts` (XML Grammar Definition)**
    *   XML 1.0 仕様書に基づいた BNF を、`parser.ts` のコンビネータを用いて TypeScript コードとして記述しています。
    *   例: `Name`, `Attribute`, `Element`, `Comment`, `CDATA` などのルールが定義されています。

---

## 🛠 開発ガイド

### 文法の修正・追加
`src/xml-grammar.ts` を編集します。
新しいルールを追加する場合は、`g.rule("ルール名", 式)` の形式で記述します。

### テストの追加
*   **コンビネータのテスト**: `src/parser.test.ts` に追加します。
*   **XML文法のテスト**: `src/xml-grammar.test.ts` に追加します。特定のルールが正しくパースできるか確認します。
*   **全体動作のテスト**: `src/integration.test.ts` に、新しいサンプルXMLなどを用いたテストケースを追加します。

### AST の構造
パース結果は `Node` クラスのインスタンスのツリー構造として返されます。
```typescript
{
  type: string;       // ルール名 (例: "element", "Attribute")
  text: string;       // マッチしたテキスト全体
  children: Node[];   // 子ノードの配列
}
```
