<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - Next.jsとSupabaseでアプリを構築する最速の方法" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Next.js & Supabase スターターキット</h1>
</a>

<p align="center">
 Next.jsとSupabaseでアプリを構築する最速の方法
</p>

<p align="center">
  <a href="#機能"><strong>機能</strong></a> ·
  <a href="#デモ"><strong>デモ</strong></a> ·
  <a href="#vercelにデプロイ"><strong>Vercelにデプロイ</strong></a> ·
  <a href="#セットアップ方法"><strong>セットアップ方法</strong></a> ·
  <a href="#フィードバックと問題"><strong>フィードバックと問題</strong></a>
  <a href="#その他のsupabase例"><strong>その他の例</strong></a>
</p>
<br/>

## 機能

- [Next.js](https://nextjs.org) スタック全体で動作
  - App Router
  - Pages Router
  - Middleware
  - Client
  - Server
  - すべて動作します！
- supabase-ssr。Supabase Authでクッキーを使用するためのパッケージ
- [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)によるパスワードベース認証ブロック
- **🤖 AI天気エージェントチャット** - 天気情報のインタラクティブチャット
  - **Mastraフレームワーク**を使用したAI天気エージェントとのリアルタイム会話
  - シームレスなエージェント通信のための**MastraClient**統合
  - 複数のMastraエージェントとワークフローのサポート
  - Supabaseデータベースへの会話の自動保存
  - 永続ストレージによるチャット履歴管理
  - 行レベルセキュリティ（RLS）によるユーザー固有の会話隔離
- **💬 チャット会話管理**
  - チャット会話の作成、表示、削除
  - メッセージの自動永続化
  - 会話履歴サイドバー
  - リアルタイムメッセージ同期
- [Tailwind CSS](https://tailwindcss.com)によるスタイリング
- [shadcn/ui](https://ui.shadcn.com/)コンポーネント
- [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)によるオプションのデプロイメント
  - 環境変数はVercelプロジェクトに自動的に割り当て

## デモ

完全に動作するデモを [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/) で確認できます。

## Vercelにデプロイ

Vercelデプロイメントは、Supabaseアカウントとプロジェクトの作成をガイドします。

Supabase統合をインストールした後、すべての関連する環境変数がプロジェクトに割り当てられ、デプロイメントが完全に機能します。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

上記により、スターターキットがGitHubにクローンされ、ローカルでクローンして開発できます。

Vercelにデプロイせずにローカルでのみ開発したい場合は、[以下の手順に従ってください](#セットアップ方法)。

## セットアップ方法

### 📋 必要な前提条件
- Node.js 18.0以上
- npm、yarn、またはpnpm
- Supabaseアカウント（無料）

---

## 🔄 パターン A: このプロジェクトをクローンして使用する

**このリポジトリのコードを使って開発を始めたい場合**

### ステップ 1: リポジトリのクローン
```bash
git clone [このプロジェクトのGitHub URL]
cd [プロジェクトディレクトリ名]
npm install
```

### ステップ 2: Supabaseプロジェクトの作成
1. [Supabaseダッシュボード](https://database.new)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名とパスワードを設定
4. 地域を選択（日本の場合は`ap-northeast-1`を推奨）

### ステップ 3: 環境変数の設定
1. プロジェクトルートに`.env.local`ファイルを作成：
   ```bash
   touch .env.local
   ```

2. Supabaseプロジェクトの設定値を取得：
   - [Supabaseダッシュボード](https://app.supabase.com)にログイン
   - 作成したプロジェクトを選択
   - サイドバーの「Settings」→「API」をクリック
   - 「Project URL」と「anon public」キーをコピー

3. `.env.local`ファイルに以下を記述：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### ステップ 4: データベーステーブルの設定
1. [Supabaseダッシュボード](https://app.supabase.com)で作成したプロジェクトを開く
2. サイドバーの「SQL Editor」をクリック
3. 「New query」ボタンをクリック
4. プロジェクト内の`supabase/001_chat_conversations.sql`ファイルを開いてコピー
5. SQLエディターに貼り付けて「Run」ボタンをクリック
6. 成功メッセージが表示されることを確認

### ステップ 5: 開発サーバーの起動
```bash
npm run dev
```

### ステップ 6: 動作確認
1. [http://localhost:3000](http://localhost:3000) にアクセス
2. アカウント作成またはログイン
3. [http://localhost:3000/chat](http://localhost:3000/chat) でチャット機能をテスト

---

## ✨ パターン B: Supabaseテンプレートから新規プロジェクトを作成する

**Supabaseの公式テンプレートをベースに新しいプロジェクトを作成したい場合**

### ステップ 1: Next.jsプロジェクトの作成
```bash
npx create-next-app --example with-supabase my-supabase-app
cd my-supabase-app
npm install
```

### ステップ 2: Supabaseプロジェクトの作成
1. [Supabaseダッシュボード](https://database.new)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名とパスワードを設定
4. 地域を選択（日本の場合は`ap-northeast-1`を推奨）

### ステップ 3: 環境変数の設定
1. `.env.example`を`.env.local`にコピー：
   ```bash
   cp .env.example .env.local
   ```

2. Supabaseプロジェクトの設定値を取得：
   - [Supabaseダッシュボード](https://app.supabase.com)にログイン
   - 作成したプロジェクトを選択
   - サイドバーの「Settings」→「API」をクリック
   - 「Project URL」と「anon public」キーをコピー

3. `.env.local`ファイルを編集：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### ステップ 4: 開発サーバーの起動
```bash
npm run dev
```

### ステップ 5: 動作確認
[http://localhost:3000](http://localhost:3000) にアクセスして基本的な認証機能を確認

**注意**: このパターンでは基本的なSupabase認証機能のみが含まれます。AIチャット機能などの追加機能は含まれていません。

---

## 🔧 追加設定（両パターン共通）

### カスタムUIスタイルの変更
```bash
# 既存のcomponents.jsonを削除
rm components.json

# shadcn/uiを再インストール
npx shadcn@latest init
```

### ⚠️ トラブルシューティング

**よくある問題と解決方法：**

1. **Supabase接続エラー**
   - `.env.local`の環境変数が正しく設定されているか確認
   - SupabaseプロジェクトのURLとキーが最新であることを確認

2. **データベースエラー**
   - SQL Editorでテーブル作成が正常に完了しているか確認
   - RLSポリシーが適用されているか確認

3. **チャット機能が動作しない（パターンAのみ）**
   - 認証済みユーザーでログインしているか確認
   - ブラウザのコンソールでエラーメッセージを確認

### 📚 参考資料
- [Supabaseローカル開発ガイド](https://supabase.com/docs/guides/getting-started/local-development) - Supabaseをローカルで実行する方法
- [Next.js 公式ドキュメント](https://nextjs.org/docs) - Next.jsの詳細な使い方
- [shadcn/ui ドキュメント](https://ui.shadcn.com/) - UIコンポーネントの使い方

## 🤖 チャット機能

このプロジェクトには、以下の機能を備えた完全に機能する**Mastraエージェントチャットシステム**が含まれています：

### コアチャット機能
- **Mastraエージェント統合**: Mastraフレームワークを搭載したインテリジェントエージェントとのチャット
- **MastraClient通信**: MastraClientを介したMastraエージェントへのシームレスな接続
- **マルチエージェントサポート**: 異なるタイプのエージェント（天気、汎用など）との対話
- **リアルタイムメッセージング**: 即座のメッセージ配信と応答
- **天気情報**: 自然言語での会話による天気データの取得

### データ永続化
- **会話ストレージ**: すべてのチャットがSupabaseデータベースに自動保存
- **メッセージ履歴**: タイムスタンプ付きの完全なメッセージ履歴
- **ユーザー分離**: 各ユーザーの会話はプライベートで安全

### ユーザーエクスペリエンス
- **チャット履歴サイドバー**: すべての過去の会話を表示・管理
- **会話管理**: 新しいチャットの作成、履歴表示、会話削除
- **レスポンシブデザイン**: デスクトップとモバイルデバイスでシームレスに動作
- **美しいUI**: shadcn/uiコンポーネントで構築されたモダンなインターフェース

### 技術アーキテクチャ
- **Mastraフレームワーク**: 強力なMastraエージェントフレームワーク上に構築
- **MastraClient統合**: Mastraエージェントとワークフローとの直接通信
- **エージェントオーケストレーション**: 複雑なマルチエージェント会話のサポート
- **データベーススキーマ**: 会話とメッセージ用に最適化されたPostgreSQLテーブル
- **行レベルセキュリティ**: Supabase RLSによるユーザー固有のデータアクセス
- **型安全性**: 生成された型との完全なTypeScript統合
- **リアルタイム更新**: コンポーネント間での同期されたチャット状態

### ファイル構造
```
├── supabase/
│   └── 001_chat_conversations.sql    # データベーススキーマ
├── lib/
│   ├── types/chat.ts                 # TypeScript定義
│   └── hooks/use-chat-storage.ts     # Supabase統合
├── components/chat/
│   └── chat-interface-with-storage.tsx  # メインチャットコンポーネント
└── app/chat/
    └── page.tsx                      # チャットページ
```

## フィードバックと問題

フィードバックや問題は[Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose)に提出してください。

## その他のSupabase例

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (無料コース)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
