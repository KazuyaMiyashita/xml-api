# TODO List: WYSIWYG & Bidirectional Sync Support

現在の `Source -> AST` の増分更新に加え、`App -> Source` の編集操作と、それを支えるイベントシステムを実装します。
また、長期的には `README.md` に記載した **3層構造 (Level 1-3)** への移行を目指します。

## 🔄 Phase 1: Reverse Sync (App -> Source Operations)
アプリケーション（AST）側からの操作を、ソースコードへの「最小限のテキスト置換（Patch）」に変換する機能を実装します。
**重要**: AST を直接書き換えるのではなく、操作を `update_input` への呼び出しに変換することで、Single Source of Truth（テキスト）を守ります。

- [ ] **Operation API (Command Pattern)**:
    - 以下の操作を行う API を `XMLAPI` に実装する。内部で `cst` の位置情報を計算し、`update_input` を呼び出す。
    - `api.setAttribute(astNode, key, value)`:
        - 既存属性ならその値の範囲 (`value` range) だけを置換。
        - 新規属性なら、適切な位置（他の属性の後ろなど）に ` key="value"` を挿入。
    - `api.updateText(astNode, text)`:
        - テキストノードの内容範囲を置換。
    - `api.replaceNode(astNode, newAstOrString)`:
        - ノード全体を新しい XML 文字列（Formatterで生成）に置換。
- [ ] **Precision Patching Logic**:
    - 属性値の変更時、引用符（`"` や `'`）の種類を維持するロジック。
    - 要素削除時、前後の空白の扱い（空行が残らないようにするなど）の検討。

## 📡 Phase 2: Reactivity & Events
ソースコードが変更された際、アプリケーションが「どのノードがどう変わったか」を知るための仕組み。

- [ ] **Event System (`EventEmitter`)**:
    - `api.on('update', (event) => ...)` の実装。
    - イベントペイロードの設計:
        - `type`: 'text' | 'structure' | 'attribute'
        - `node`: 影響を受けた AST ノード
        - `path`: ルートからのパス（オプション）
- [ ] **Change Detection**:
    - `updateASTIncremental` 内で、変更前後の AST を比較し、具体的な変更イベントを発火させる。

## 🏗 Phase 3: Architectural Evolution (Toward 3-Layer)
現在の Enhanced AST を、明示的な中間層（IR）を持つ構造へと進化させる準備。

- [ ] **Separate ID Management**:
    - AST ノードに依存せず、CST ノードに対して永続的な一意 ID (UUID等) を割り振るメカニズムの検討。
- [ ] **Mapping Layer Abstraction**:
    - `xml-converter` を拡張し、`CST <-> IR <-> AST` の相互変換を行う `Mapper` クラスとしての再設計。

## 🛡 Phase 4: Robustness & DX
- [ ] **Transaction Management**:
    - 複数の操作（例：属性変更 + テキスト変更）を1つの Undo/Redo 単位として扱う仕組み。
- [ ] **Error Recovery for App Editing**:
    - アプリ側からの編集が（バリデーション等で）不正な XML を生成しそうな場合のガード処理。

## ✅ Completed Tasks
- [x] **Performance Optimization**: Delayed Coordinate Update & Atomic Transaction.
- [x] **Architecture Evolution**: Enhanced AST (CST Mapping).
- [x] **AST Incremental Update**: Differential Update (In-Place AST mutation).
- [x] **Formatter**: Smart indentation XML output.
- [x] **Testing**: Comprehensive tests for AST-CST mapping and incremental updates.