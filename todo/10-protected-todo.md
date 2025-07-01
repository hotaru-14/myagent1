# Protected → Dashboard 変更タスク

## 📋 TODO リスト

### 🗂️ フォルダ構造の変更
- [x] `app/protected/` フォルダを `app/dashboard/` にリネーム
- [x] フォルダ内のファイル構成を確認

### 📄 ページファイルの更新 (`page.tsx`)
- [x] 関数名を `ProtectedPage` → `DashboardPage` に変更
- [x] コメント内の "protected page" → "dashboard page" に変更
- [x] ページタイトルや説明文の更新

### 🎨 レイアウトファイルの更新 (`layout.tsx`)
- [x] 関数名を `ProtectedLayout` → `DashboardLayout` に変更
- [x] プロパティの型定義更新

### 🔗 参照・リンクの更新
- [x] `/protected` へのリンクを `/dashboard` に変更
- [x] ナビゲーションコンポーネントの更新
- [x] インポート文の変更 (`@/app/protected/` → `@/app/dashboard/`)

### 🛡️ 認証・リダイレクトの確認
- [x] ログイン成功後のリダイレクト先を確認・変更
- [x] 認証チェック処理の動作確認
- [x] ミドルウェアの保護ルート設定確認

### 🧪 テスト・動作確認

#### 🔄 基本機能テスト
- [ ] `/dashboard` URLでページにアクセス可能か確認
- [ ] 未認証時のリダイレクト動作確認
- [ ] 認証済みユーザーのページ表示確認
- [ ] ユーザー情報の表示確認

#### 🛡️ 認証フローテスト
- [ ] ログイン成功後の `/dashboard` リダイレクト確認
- [ ] セッション切れ時の `/auth/login` リダイレクト確認
- [ ] 不正なトークンでのアクセス拒否確認
- [ ] ブラウザの戻るボタンでの認証状態確認

#### 🌐 URLルーティングテスト
- [ ] `/protected` アクセス時の404エラー確認
- [ ] `/dashboard` の直接アクセス確認
- [ ] ネストされたルート（存在する場合）の動作確認
- [ ] クエリパラメータ付きURLの動作確認

#### 📱 レスポンシブ・UI テスト
- [ ] モバイル表示での認証フロー確認
- [ ] タブレット表示での画面レイアウト確認
- [ ] デスクトップでの全機能確認
- [ ] ダークモード/ライトモードでの表示確認

#### ⚡ パフォーマンステスト
- [ ] ページロード時間の測定（認証前後）
- [ ] 初回アクセス時のレスポンス時間確認
- [ ] 認証チェック処理の応答速度確認
- [ ] メタデータ読み込み時間の確認

#### 🔍 SEO・メタデータテスト
- [ ] `<title>` タグの内容確認
- [ ] `<meta description>` の内容確認
- [ ] OpenGraph画像の表示確認
- [ ] robots.txtでの新しいパス確認
- [ ] サイトマップの更新確認

#### 🚀 本番環境専用テスト
- [ ] HTTPSでの認証フロー確認
- [ ] CDNキャッシュでの新しいルート確認
- [ ] 外部リンクからのアクセステスト
- [ ] 検索エンジンからのアクセス確認
- [ ] ブックマークからの旧URL削除確認

#### 🧪 自動テスト（推奨）
- [ ] E2Eテスト：認証フロー全体
- [ ] ユニットテスト：認証チェック関数
- [ ] インテグレーションテスト：ページコンポーネント
- [ ] スナップショットテスト：UI変更の検出

## 🤖 GitHub Actions 自動テスト要件

### 📁 ワークフローファイルの設定
- [x] `.github/workflows/` ディレクトリの作成
- [x] `ci-tests.yml` ワークフローファイルの作成
- [x] PRトリガーの設定（`on: pull_request`）
- [x] mainブランチ対象の設定

### 🔧 基本的なCI設定
- [x] Node.js環境のセットアップ（v18以上）
- [x] 依存関係のインストール（`npm ci`）
- [x] TypeScriptコンパイルチェック
- [x] ESLint実行とエラーチェック
- [x] Prettierフォーマットチェック

### 🧪 テスト実行の設定
- [x] Jestユニットテストの実行
- [x] テストカバレッジレポートの生成
- [x] E2Eテストの実行（Playwright）
- [x] パフォーマンステストの実行
- [x] 認証フローテストの実行

### 🛡️ 専用テストケースの追加
- [x] `/protected` → 404エラーの確認テスト
- [x] `/dashboard` → 正常アクセスの確認テスト
- [x] 認証フロー全体のE2Eテスト
- [x] リダイレクト動作の確認テスト
- [x] コンポーネント名変更の反映テスト

### 🔒 ブランチ保護ルールの設定
- [ ] GitHubリポジトリの Settings → Branches 設定
- [ ] mainブランチの保護ルール追加
- [ ] "Require status checks to pass before merging" 有効化
- [ ] "Require branches to be up to date before merging" 有効化
- [ ] 対象ワークフローの選択と設定

### 📊 レポート機能の設定
- [ ] テストカバレッジレポートのアップロード
- [ ] アーティファクトとしてのテスト結果保存
- [ ] 失敗時のスクリーンショット保存（E2E）
- [ ] パフォーマンスメトリクスの記録

### 🔄 マトリックス戦略の検討
- [ ] 複数Node.jsバージョンでのテスト
- [ ] 複数OS環境でのテスト（Ubuntu/Windows/macOS）
- [ ] 異なるブラウザでのE2Eテスト

### ⚠️ エラーハンドリング設定
- [ ] テスト失敗時の詳細ログ出力
- [ ] タイムアウト設定（30分以内）
- [ ] リトライ機能の設定
- [ ] 通知設定（Slack/Email）

### 🚀 最適化設定
- [ ] 依存関係のキャッシュ設定
- [ ] ビルドアーティファクトの共有
- [ ] 並列実行の最適化
- [ ] 不要なステップのスキップ条件

### 📋 実装チェックリスト
- [ ] ワークフローファイルの文法チェック
- [ ] ローカルでのact実行テスト
- [ ] PRでの動作確認
- [ ] ブランチ保護の動作確認
- [ ] テスト失敗時のマージブロック確認

### 🔍 コードベース全体の確認
- [x] `grep -r "protected" .` でprotectedの残存確認
- [x] `grep -r "/protected" .` でURLパスの残存確認
- [ ] README.mdやドキュメントの更新

### 🚀 本番環境対応
- [ ] 本番環境でのページ必要性の再評価
- [ ] 不要な場合は削除を検討
- [ ] 実際のダッシュボード機能への置き換え検討

## ⚠️ 注意事項
- URLの変更により、既存のブックマークやリンクが無効になる
- SEOへの影響を考慮する
- 本番環境では実際のダッシュボード機能に置き換えることを推奨

## 🎯 完了後の確認ポイント
- [ ] 新しいURL `/dashboard` でアクセス可能
- [ ] 旧URL `/protected` で404エラー
- [ ] 認証フローが正常に動作
- [ ] レスポンシブデザインの確認

## 🤖 GitHub Actions ワークフローファイル例

### 推奨ワークフロー設定
```yaml
# .github/workflows/dashboard-tests.yml
name: Dashboard Rename Tests

on:
  pull_request:
    branches: [main]
    paths:
      - 'app/dashboard/**'
      - 'app/protected/**'
      - '__tests__/**'
      - 'e2e/**'

env:
  NODE_VERSION: '18'
  COVERAGE_THRESHOLD: 80

jobs:
  # 🔧 基本チェック
  lint-and-type-check:
    name: Lint and Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: TypeScript type check
        run: npx tsc --noEmit
      
      - name: ESLint check
        run: npm run lint
      
      - name: Prettier check
        run: npm run format:check

  # 🧪 ユニットテスト
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint-and-type-check
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests with coverage
        run: npm run test:coverage
      
      - name: Check coverage threshold
        run: |
          COVERAGE=$(npx nyc report --reporter=text-summary | grep "Lines" | awk '{print $2}' | sed 's/%//')
          if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below threshold $COVERAGE_THRESHOLD%"
            exit 1
          else
            echo "✅ Coverage $COVERAGE% meets threshold $COVERAGE_THRESHOLD%"
          fi
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  # 🌐 E2Eテスト
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
      
      - name: Start application
        run: |
          npm start &
          npx wait-on http://localhost:3000
        env:
          NODE_ENV: production
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: e2e-test-results
          path: test-results/

  # 🛡️ 専用テスト（protected → dashboard）
  dashboard-specific-tests:
    name: Dashboard Specific Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: |
          npm start &
          npx wait-on http://localhost:3000
      
      - name: Test old protected route returns 404
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/protected)
          if [ "$response" != "404" ]; then
            echo "❌ /protected should return 404, got $response"
            exit 1
          else
            echo "✅ /protected correctly returns 404"
          fi
      
      - name: Test new dashboard route accessibility
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
          if [ "$response" != "200" ] && [ "$response" != "302" ]; then
            echo "❌ /dashboard should be accessible, got $response"
            exit 1
          else
            echo "✅ /dashboard is accessible"
          fi

  # ⚡ パフォーマンステスト
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: e2e-tests
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

## 🧪 推奨テストコード例

### E2Eテスト (Playwright/Cypress)
```typescript
// tests/dashboard-auth.spec.ts
test('認証フローとダッシュボードアクセス', async ({ page }) => {
  // 未認証でのダッシュボードアクセス
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/auth/login');
  
  // ログイン処理
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  // ダッシュボードにリダイレクト確認
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Your user details');
});

test('旧protectedルートが404を返すか確認', async ({ page }) => {
  const response = await page.goto('/protected');
  expect(response?.status()).toBe(404);
});
```

### ユニットテスト (Jest/Vitest)
```typescript
// __tests__/dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

// モックの設定
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      }))
    }
  }))
}));

test('認証済みユーザーにダッシュボードを表示', async () => {
  const DashboardComponent = await DashboardPage();
  render(DashboardComponent);
  
  expect(screen.getByText('Your user details')).toBeInTheDocument();
  expect(screen.getByText('"email": "test@example.com"')).toBeInTheDocument();
});
```

### パフォーマンステスト
```typescript
// tests/performance.spec.ts
test('ダッシュボードのロード時間測定', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  // 3秒以内でロード完了を期待
  expect(loadTime).toBeLessThan(3000);
});
```

## 📊 本番環境チェックリスト

### デプロイ前確認
- [ ] 全自動テストが通過
- [ ] TypeScriptコンパイルエラーなし
- [ ] ESLintエラーなし
- [ ] ビルドが成功

### デプロイ後確認
- [ ] ヘルスチェックURL応答確認
- [ ] 認証フロー動作確認
- [ ] エラーログ監視設定
- [ ] アナリティクス設定更新

## 🎯 GitHub Actions ベストプラクティス

### 🔒 セキュリティ対策
- [ ] シークレット環境変数の適切な設定
- [ ] 権限の最小化（`permissions`設定）
- [ ] 依存関係の脆弱性チェック
- [ ] サードパーティアクションのバージョン固定

### ⚡ パフォーマンス最適化
- [ ] 依存関係キャッシュの活用
- [ ] マトリックス戦略の適切な使用
- [ ] 不要なステップのスキップ条件設定
- [ ] 並列実行の最大化

### 📊 監視・レポート
- [ ] テスト結果の可視化設定
- [ ] 失敗通知の設定（Slack/Teams）
- [ ] メトリクス収集の設定
- [ ] 実行時間の監視

### 🔄 メンテナンス
- [ ] 定期的なアクションバージョン更新
- [ ] 不要なワークフローの削除
- [ ] 実行履歴の定期クリーンアップ
- [ ] ドキュメントの更新

## ⚠️ GitHub Actions 注意事項

### 🚨 重要な制限事項
- **実行時間制限**: 1ジョブあたり最大6時間
- **並列ジョブ数**: プランによる制限あり
- **ストレージ制限**: アーティファクト保存期間に注意
- **ネットワーク**: 外部サービスへの接続制限

### 💰 コスト管理
- **パブリックリポジトリ**: GitHub-hostedランナーは無料
- **プライベートリポジトリ**: 月間利用時間に制限あり
- **セルフホストランナー**: サーバーコストを考慮
- **最適化**: 不要な実行を避ける条件設定

### 🛠️ トラブルシューティング
- **ローカルテスト**: `act` コマンドでの事前確認
- **デバッグモード**: `ACTIONS_STEP_DEBUG=true` の活用
- **ログの詳細化**: 必要に応じた詳細ログ設定
- **タイムアウト対策**: 適切なタイムアウト値の設定

この設定により、[Next.jsアプリケーションでのJestとGitHub Actionsを活用した自動テスト](https://dev.to/afraz33/automating-testing-in-nextjs-ensuring-code-integrity-with-jest-and-github-actions-3bbe)が実現でき、安全で信頼性の高いCI/CDパイプラインが構築できます。
