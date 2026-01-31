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

## 🏗 アーキテクチャと現状

現在、**Source -> App (AST)** の一方向の高速同期基盤が完成しています。

1.  **Parser Core**: 構文解析エンジン (`parser.ts`) と文法管理 (`grammar.ts`)
2.  **CST (Concrete Syntax Tree)**: 生の構文木。空白やコメントを含むすべてのテキスト情報を保持。
3.  **Enhanced AST**: CST への参照 (`.cst`) を持つ高レベルデータ構造。アプリケーションはこの層を扱います。
4.  **Incremental Engine**: テキスト変更に対し、影響範囲を特定して CST/AST を部分的に更新するアトミックなトランザクション機構。
5.  **Formatter**: AST から標準的な XML を生成する機能（新規ノード生成用）。

### ディレクトリ構成

```
.
├── src/
│   ├── main.ts                  # エントリーポイント。API使用デモ
│   ├── xml-api.ts               # 統合API (XMLAPI class)
│   ├── parser.ts                # パース実行エンジン
│   ├── grammar.ts               # 文法構築
│   ├── xml-cst.ts               # CST 定義 (Source of Truth for formatting)
│   ├── xml-ast.ts               # AST 定義 (Application Interface)
│   ├── xml-converter.ts         # CST -> AST 変換・マッピング
│   ├── formatter.ts             # AST -> XML 整形
│   ├── xml-grammar.ts           # XML 1.0 文法定義
│   └── *.test.ts                # テストスイート
```

## 🔄 同期メカニズム（実装済み）

### Source to AST (Incremental Update)
ユーザーがソースコードを編集した際、`update_input(from, to, text)` が呼び出されます。
1.  **再パース**: 変更範囲を含む最小の CST ノードを特定し、その部分だけを再パースします。
2.  **CST 更新**: パース成功時のみ、ツリーを差し替えます（アトミック更新）。
3.  **AST 追従**: 変更された CST ノードに対応する AST ノードのみを再生成し、オブジェクトの参照（Identity）を保ったまま中身を更新します。これにより、アプリ側の再レンダリングを最小化します。

---

*今後の開発ロードマップについては [TODO.md](./TODO.md) を参照してください。*