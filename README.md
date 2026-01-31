# XML API

TypeScript で実装された、**WYSIWYG エディタや IDE のための基盤**となる XML パーサー・操作 API です。

「アプリケーションからの直感的な操作」と「ソースコードの完全な忠実性（Full Fidelity）」を両立させることを目的としており、パース結果の抽象構文木（AST）と生の構文木（CST）を高度にリンクさせることで、高速かつ堅牢な双方向同期（Bidirectional Sync）を実現します。

## 🎯 プロジェクトのゴール

本プロジェクトは、以下の要件を満たす **"Perfect Round-Trip"** な編集基盤を目指しています。

1.  **直感的な操作**: アプリケーション層（WYSIWYGエディタ等）は、DOMのような単純な API で XML を操作できる。
2.  **完全な忠実性 (Full Fidelity)**: プログラムによる編集が行われても、**変更されていない箇所の空白、インデント、コメントは 1バイトたりとも変更しない**。
3.  **双方向のリアルタイム同期**:
    *   **Source -> App**: テキストエディタでのソース編集を、瞬時に AST に反映しアプリに通知する（増分パース）。
    *   **App -> Source**: アプリ上での操作（ノード移動、属性変更）を、ソースコードへの**最小限のテキストパッチ**に変換し、フォーマットを崩さずに適用する。

## 🏗 アーキテクチャ (Target Architecture)

本プロジェクトは、最終的に以下の **3層構造 (Three-Layer Architecture)** への到達を目指しています。
これにより、「保存されたテキストの正確さ」と「編集のしやすさ」という相反する要件を完全に分離・解決します。

### Level 1: CST (Concrete Syntax Tree) - *The Source of Truth*
*   **役割**: ソースコードの完全な構造化表現。
*   **責務**: 空白、改行、コメント、属性の引用符の種類など、**テキスト上のすべての情報を保持**します。
*   **不変性**: ユーザーが明示的に変更しない限り、この層の情報は一切失われません。フォーマッターはこの層を尊重します。

### Level 2: Intermediate Representation (IR) - *The Semantic Bridge*
*   **役割**: 構文（Level 1）とアプリケーションモデル（Level 3）の間の「意味的マッピング」と「状態管理」。
*   **責務**:
    *   **Identity & Tracking**: ノードに永続的な ID を割り当て、移動や変更を追跡します。
    *   **Bi-directional Mapping**: CST の「どの範囲」が、AST の「どのノード」に対応するかを厳密に管理します。
    *   **Abstraction**: `<br />` と `<br></br>` のような構文上の差異を吸収し、同一の意味として扱えるようにします。

### Level 3: Application AST - *The View Model*
*   **役割**: アプリケーション（エディタUIなど）が扱う純粋なデータモデル。
*   **責務**: DOM に近い、シンプルで直感的な API を提供します。
*   **隠蔽**: CST の複雑さ（位置情報、空白ノード）や IR の管理ロジックはこの層からは隠蔽され、開発者はビジネスロジックに集中できます。

---

### 💻 現在の実装状況 (Current Implementation)

現在は過渡期として、**Level 2 (IR) と Level 3 (Application AST) を統合した "Enhanced AST"** パターンを採用しています。

1.  **Parser Core**: `parser.ts`, `grammar.ts`
2.  **CST (Level 1)**: `xml-cst.ts` - 完全な情報を保持。
3.  **Enhanced AST (Level 2+3)**: `xml-ast.ts`
    *   `AST` クラスが直接 `.cst` プロパティを持ち、Level 1 への参照を保持することでマッピングを実現しています。
4.  **Incremental Engine**: アトミックな部分更新トランザクション。
5.  **Formatter**: AST からの出力生成。

今後の開発で複雑度が増すにつれ、Enhanced AST から IR 層（Level 2）を分離・独立させていくロードマップを描いています。

### ディレクトリ構成

```
.
├── src/
│   ├── main.ts                  # デモ・エントリーポイント
│   ├── xml-api.ts               # API ファサード
│   ├── parser.ts                # パースエンジン
│   ├── grammar.ts               # 文法構築
│   ├── xml-cst.ts               # [Level 1] CST 定義
│   ├── xml-ast.ts               # [Level 2+3] AST 定義 (Enhanced)
│   ├── xml-converter.ts         # CST -> AST 変換・マッピング
│   ├── formatter.ts             # XML 出力
│   ├── xml-grammar.ts           # 文法定義
│   └── *.test.ts                # テスト
```

## 🔄 同期メカニズム（実装済み）

### Source to AST (Incremental Update)
ユーザーがソースコードを編集した際、`update_input(from, to, text)` が呼び出されます。
1.  **再パース**: 変更範囲を含む最小の CST ノードを特定し、その部分だけを再パースします。
2.  **CST 更新**: パース成功時のみ、ツリーを差し替えます（アトミック更新）。
3.  **AST 追従**: 変更された CST ノードに対応する AST ノードのみを再生成し、オブジェクトの参照（Identity）を保ったまま中身を更新します。これにより、アプリ側の再レンダリングを最小化します。

---

*今後の開発ロードマップについては [TODO.md](./TODO.md) を参照してください。*
