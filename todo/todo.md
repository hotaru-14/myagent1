# エージェント切り替え機能 実装Todo

## フェーズ1: データベース修正
- [ ] Supabaseスキーマ更新（`conversations.agent_id`削除）
- [ ] 既存の`conversations`テーブルから`agent_id`カラム削除
- [ ] `messages.agent_id`のみ残す（既に実装済み）

## フェーズ2: 型定義とエージェント管理
- [ ] `lib/types/agent.ts` - エージェント型定義作成
- [ ] `lib/constants/agents.ts` - 利用可能エージェント定数定義
- [ ] `lib/hooks/use-agent-state.ts` - エージェント状態管理フック作成
- [ ] `lib/types/chat.ts` - `conversations`から`agent_id`削除、`messages`の`agent_id`確認

## フェーズ3: ドロップダウンコンポーネント作成
- [ ] `components/features/chat/agent-selector/` フォルダ作成
- [ ] `components/features/chat/agent-selector/agent-dropdown.tsx` - メインドロップダウン
- [ ] `components/features/chat/agent-selector/agent-option.tsx` - 個別選択肢
- [ ] `components/features/chat/agent-selector/index.ts` - エクスポート管理
- [ ] ドロップダウンのスタイリング

## フェーズ4: チャットヘッダー統合
- [ ] `components/features/chat/chat-header.tsx` - エージェント選択ドロップダウン追加
- [ ] エージェント名・アイコン動的表示
- [ ] レスポンシブ対応（モバイル時のコンパクト表示）
- [ ] 統合後のスタイル調整

## フェーズ5: API層対応
- [ ] `app/api/chat/route.ts` - `agentId`受け取り機能追加
- [ ] リクエストボディの`agentId`パラメータ対応
- [ ] エラーハンドリング強化（無効なagentId対応）

## フェーズ6: ストレージ層更新
- [x] `lib/hooks/use-chat-storage.ts` - `agentId`対応
- [x] `saveMessage`関数に`agentId`追加
- [x] `createConversation`関数から`agentId`削除
- [x] 会話読み込み時のデフォルトエージェント設定
  - [x] 新規会話開始時はデフォルトエージェント（初期値は`weatherAgent`、今後変更しやすいよう定数管理）
  - [x] 既存会話を開く場合は、その会話の最後のメッセージの`agent_id`を自動で選択中エージェントに設定
  - [x] デフォルトエージェントIDは`lib/constants/agents.ts`等で一元管理し、将来の変更が容易な設計にする

## フェーズ7: メインチャット統合
- [x] `components/features/chat/chat-interface-with-storage.tsx` - エージェント状態管理追加
- [x] エージェント切り替え時の処理実装
- [x] プレースホルダーのエージェント別対応
- [x] 送信時の`agentId`付与

## フェーズ8: UI改善
- [ ] `components/features/chat/message/message-avatar.tsx` - エージェント別アバター
- [ ] `components/features/chat/history/conversation-item.tsx` - 動的エージェントアイコン表示
- [ ] `components/features/chat/history/chat-history-sidebar.tsx` - エージェント表示改善
- [ ] `components/features/chat/chat-input.tsx` - エージェント別プレースホルダー

## フェーズ9: スタイリング
- [ ] エージェント選択ドロップダウンのスタイル
- [ ] エージェント別の色分け・テーマ
- [ ] ホバー・フォーカス状態のスタイル
- [ ] モバイル対応スタイル

## フェーズ10: 機能テスト
- [ ] エージェント切り替え動作確認
- [ ] データベース保存確認（`messages.agent_id`）
- [ ] 会話履歴でのエージェント表示確認
- [ ] エラーケースのテスト

## フェーズ11: バグ修正・最適化
- [ ] パフォーマンス最適化
- [ ] UIレスポンス改善
- [ ] アクセシビリティ対応
- [ ] 最終テスト・デバッグ

## フェーズ12: 自動エージェント選択機能（後で実装）
- [ ] `lib/utils/agent-selection.ts` - 自動選択ロジック作成
  - [ ] `analyzeInputForAgent` 関数（入力テキスト分析）
  - [ ] `getAgentBySpecialty` 関数（専門分野マッチング）
  - [ ] `selectOptimalAgent` 関数（最適エージェント選択）
- [ ] `lib/constants/agent-rules.ts` - エージェント選択ルール定義
  - [ ] キーワードベースルール
  - [ ] カテゴリ分類ルール
  - [ ] 言語・形式判定ルール
- [ ] `lib/hooks/use-auto-agent-selection.ts` - 自動選択状態管理
  - [ ] 自動選択有効/無効設定
  - [ ] 選択理由の表示
  - [ ] ユーザーによる手動上書き対応
- [ ] `lib/types/agent-selection.ts` - 選択関連型定義
- [ ] `components/features/chat/agent-selector/auto-selection-indicator.tsx` - 自動選択表示
- [ ] 自動選択時の表示（推奨マーク等）
- [ ] 自動選択されたエージェントのログ記録
- [ ] 入力時の自動エージェント選択処理実装
- [ ] 自動選択の理由表示機能
- [ ] 自動選択時のビジュアルフィードバック
- [ ] 自動選択時の表示スタイル
- [ ] 自動エージェント選択機能テスト
- [ ] 自動選択の精度テスト

## Todo進捗まとめ

### 完了済み
- `lib/hooks/use-chat-storage.ts` - `agentId`対応
- `saveMessage`関数に`agentId`追加
- `createConversation`関数から`agentId`削除
- **会話読み込み時のデフォルトエージェント設定（新規/既存会話での自動切り替え）** ✅
  - 新規会話開始時のデフォルトエージェント設定
  - 既存会話を開く際の最後のメッセージのagent_id自動検出・切り替え
  - 無効なagent_idの場合のデフォルトエージェントフォールバック機能
- **フェーズ7: メインチャット統合** ✅
  - `components/features/chat/chat-interface-with-storage.tsx` エージェント状態管理統合
  - エージェント切り替え時の処理実装
  - `components/features/chat/chat-input.tsx` エージェント別プレースホルダー対応
  - 送信時の`agentId`付与機能

### 未完了
- その他、各フェーズの未完了項目（詳細は上記リスト参照） 