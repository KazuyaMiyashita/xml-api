# Roadmap & Todo

このドキュメントは、`xml-api` を堅牢な双方向編集エンジンへと進化させるためのロードマップです。
最終的には、ProseMirrorやCodeMirrorのような「Transactionベースの状態管理」と、Yjsのような「CRDT（Conflict-free Replicated Data Type）」との親和性を目指します。

## 作業・コミットのルール

1.  **方針の検証**:
    - 作業を開始する前に、現在のコードベースとこのTODOリストを見比べ、方針が現在も有効か、技術的な矛盾が生じていないかを必ず検証すること。
    - 必要であれば、タスクに着手する前にこのドキュメントを修正すること。
2.  **コミットの粒度**:
    - 各チェックボックス（タスク）の単位でコミットを行うこと。
3.  **品質チェック**:
    - 各コミットの前には必ず以下を実施し、品質を担保すること：
        - `pnpm test` (テスト通過)
        - `pnpm docs:gen-api` (ドキュメント更新)
        - `pnpm format` (コード整形)

---

## Phase 1: デモのUX改善と用語の統一 (Immediate Fixes)

### 背景・目的
リファクタリングにより内部構造は整理されましたが、ユーザーが触れるデモアプリ (`XmlApiDemo.vue`) には、まだ「AST」という古い用語が残っていたり、「編集すると選択状態が解除される」というUX上の欠陥があります。
特に選択状態の喪失は、双方向編集の体験を著しく損なうため、最優先で修正します。この修正プロセスを通じて、ModelのID安定性（Identity Preservation）が正しく機能しているかも検証します。

- [x] **UIのラベル修正**:
    - **Goal**: ユーザーに見える用語を内部実装（Modelアーキテクチャ）と一致させ、混乱を防ぐ。
    - **Task**: "AST Structure" を "Model Structure" または "Tree View" に変更する。
- [x] **選択状態維持のロジック改善 (Fix Selection Loss)**:
    - **Goal**: ドキュメント編集時にフォーカスや選択ノードがリセットされるのを防ぎ、快適な編集体験を提供する。
    - **Task**:
        1. `XmlApiDemo.vue` で `selectedId` (string) を保持するように変更する。（参照ベースからIDベースへの移行）
        2. `refreshTree()` 時に、新しい Model ツリーから `selectedId` を持つノードを再探索して `selectedNode` を復元するロジックを実装する。
        3. `XmlBinder.reconcile` が属性変更時に確実にノードIDを維持しているか検証し、必要なら修正する。

## Phase 2: 機能の穴埋め (Missing Features)

### 背景・目的
現在の `XMLAPI` はテキスト編集や属性変更には対応していますが、DOM APIの核心である「要素の追加・削除」がソースコードに反映されません（`console.warn` が出るのみ）。
これでは「XMLアプリケーション側からの操作で文書構造を変える」という要件を満たせません。このフェーズで DOM インターフェースとしての最低限の要件を充足させます。

- [ ] **DOM構造変更の同期サポート**:
    - **Goal**: DOM API (`appendChild`, `removeChild`) を通じた構造変更が、即座にソースコード（XMLテキスト）に反映されるようにする。
    - **Task**:
        1. `SyncEngine` に `insertNode(parent: ModelElement, child: ModelNode, index: number)` メソッドを追加する。（論理操作の定義）
        2. `SyncEngine` に `removeNode(parent: ModelElement, child: ModelNode)` メソッドを追加する。（論理操作の定義）
        3. `XMLBinder` に、上記操作に対応するテキストパッチ計算ロジック (`calcInsertNodePatch`, `calcRemoveNodePatch`) を実装する。（物理変更への変換）
        4. `src/dom.ts` の `DOMObserver` (`onChildAdded`, `onChildRemoved`) でこれらを呼び出すように配線する。（イベントの接続）

## Phase 2.5: アーキテクチャ準備 (Refactoring for Transaction)

### 背景・目的
Phase 3 で導入する「Transactionモデル」は、状態を不変（Immutable）として扱い、変更を「新しい状態を生成する操作」として定義します。
現在のコードはオブジェクトを直接書き換える（Mutable）部分が多く、イベント通知も情報不足です。いきなり移行すると複雑になりすぎるため、まずは「型定義」と「メソッドの責務」を整理し、Transaction導入の下地を作ります。

- [ ] **イベント定義の厳格化**:
    - **Goal**: UI側が「どのノードがどう変わったか」を正確に知り、最小限の再描画で済むようにする。将来の Transaction 通知の基盤とする。
    - **Task**: `xml-api-events.ts` のイベント型を Discriminated Union (例: `{ type: 'text-change', nodeId: string, newValue: string }`) に再定義し、発生箇所で詳細な情報を含めるように修正する。
- [ ] **Modelの不変性強化の準備**:
    - **Goal**: 状態の履歴管理やUndo/Redo、並行編集（CRDT）において必須となる「オブジェクトの不変性」を導入しやすくする。
    - **Task**:
        - `ModelElement.clone()` メソッドの実装。
        - 状態変更を伴う操作をメソッドに集約し、将来的に「変更後の新しいModelを返す」形へ移行しやすい構造にする。

## Phase 3: トランザクションアーキテクチャへの刷新 (Next Gen Architecture)

### 背景・目的
CodeMirror や ProseMirror が採用している「Unidirectional Data Flow」と「Transaction」の概念を取り入れます。
現在は `updateSource` や `setAttribute` が即座に副作用（パース、状態更新）を起こしますが、これを「Transaction（変更計画）」の作成と「Dispatch（適用）」に分離します。これにより、変更の検閲、加工、結合が可能になり、エディタとしての堅牢性が飛躍的に向上します。

### 設計コンセプト

```typescript
// 擬似コード: 目指すアーキテクチャ
const tr = state.tr.setAttribute(nodeId, "class", "active");
const newState = state.apply(tr);
view.update(newState);
```

### タスク

- [ ] **State オブジェクトの定義**:
    - **Goal**: 「ある時点のエディタの状態」をスナップショットとして保持できるようにする。
    - **Task**: `XMLAPI` が持つ可変状態（`source`, `model`, `history`, `cst`）を、不変（またはスナップショット可能）な `EditorState` クラスに切り出す。
- [ ] **Transaction クラスの実装**:
    - **Goal**: 「変更の内容」をオブジェクトとして表現し、履歴管理やイベント通知で扱えるようにする。
    - **Task**: 変更内容を表現する `Transaction` クラスを実装する。（プロパティ: `docChanged`, `patches`, `selection` 等）
- [ ] **SyncEngine のパイプライン化**:
    - **Goal**: 変更処理を「適用」の1箇所に集約し、副作用を制御する。
    - **Task**:
        - `updateSource` や `setAttribute` を「Transactionを作成してDispatchする」形にリファクタリングする。
        - `dispatch(tr: Transaction)` メソッドを実装し、ここで状態更新を行うようにする。
- [ ] **イベントシステムの刷新**:
    - **Goal**: クライアントアプリが、Transaction単位で効率的に状態を同期できるようにする。
    - **Task**:
        - `full`, `structure` といった粗いイベント通知を廃止し、Transaction オブジェクトそのものを通知する形へ変更する。
        - クライアント側（UI）は Transaction を受け取り、差分情報をもとにDOMを部分更新するように修正する。

## Phase 4: コラボレーション & CRDT対応 (Long Term)

### 背景・目的
Google Docsのようなリアルタイム共同編集を実現するため、YjsなどのCRDTライブラリとの統合を見据えます。
Phase 3で整えたTransactionモデルがあれば、Transactionの内容をCRDT操作に変換（およびその逆）することで、比較的容易に同期機能を実現できるはずです。

- [ ] **Yjs / Automerge 連携の検討**:
    - **Goal**: 複数のユーザーが同時に編集しても整合性を保てるようにする。
    - **Task**:
        - `ModelNode` の ID を CRDT の ID とマッピングする仕組みの設計。
        - `XMLBinder` のパッチ生成ロジックを、CRDT の操作（`yMap.set`, `yXmlFragment.insert`）に変換するアダプターの作成。
