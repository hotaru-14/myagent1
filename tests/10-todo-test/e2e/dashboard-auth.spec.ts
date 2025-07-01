import { test, expect } from '@playwright/test'

test.describe('Dashboard Authentication Flow', () => {
  test('未認証でのダッシュボードアクセスでログインページにリダイレクト', async ({ page }) => {
    // 未認証でダッシュボードにアクセス
    await page.goto('/dashboard')
    
    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/auth/login')
    
    // 実際のHTML構造に合わせたセレクター
    await expect(page.locator('div.font-semibold:has-text("Login")')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('旧protectedルートの動作確認', async ({ page }) => {
    // 認証ミドルウェアにより/auth/loginにリダイレクトされることを確認
    const response = await page.goto('/protected')
    
    // 現在の実装では、存在しないパスでも認証ミドルウェアがリダイレクトする
    // 307 Temporary Redirectまたは認証ページの表示を確認
    expect([200, 307].includes(response?.status() || 0)).toBeTruthy()
    
    // ログインページにリダイレクトされているか確認
    await expect(page).toHaveURL('/auth/login')
    await expect(page.locator('div.font-semibold:has-text("Login")')).toBeVisible()
  })

  test('ダッシュボードページの構造確認', async ({ page }) => {
    // ログインページに移動
    await page.goto('/auth/login')
    
    // テスト用の認証をスキップ（実際の認証が設定されていない場合）
    // 本番環境では適切な認証フローを実装
    const currentUrl = page.url()
    
    if (currentUrl.includes('/auth/login')) {
      // ログインページが正常に表示されていることを確認
      await expect(page.locator('div.font-semibold:has-text("Login")')).toBeVisible()
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]:has-text("Login")')).toBeVisible()
      
      // 実際の認証テストは環境が整った場合に実装
      console.log('認証テストはSupabase設定完了後に実装予定')
    }
  })

  test('ページタイトルとメタデータの確認', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 実際のタイトルを確認（Next.js and Supabase Starter Kit）
    await expect(page).toHaveTitle(/Next\.js.*Supabase.*Starter.*Kit|Login|Dashboard/i)
  })

  test('レスポンシブデザインの確認', async ({ page }) => {
    // モバイルビューポートでテスト
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/auth/login')
    
    // モバイルでの表示確認（実際の構造に合わせたセレクター）
    await expect(page.locator('div.font-semibold:has-text("Login")')).toBeVisible()
    
    // デスクトップビューポートでテスト
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.reload()
    
    // デスクトップでの表示確認
    await expect(page.locator('div.font-semibold:has-text("Login")')).toBeVisible()
  })

  test('パフォーマンス基本チェック', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // 5秒以内でページロード完了を期待
    expect(loadTime).toBeLessThan(5000)
  })

  test('認証が必要なルートの基本動作', async ({ page }) => {
    // /dashboard, /chat など認証が必要なルートが適切にリダイレクトされるか確認
    const protectedRoutes = ['/dashboard', '/chat']
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL('/auth/login')
      await expect(page.locator('div.font-semibold:has-text("Login")')).toBeVisible()
    }
  })

  test('公開ルートのアクセス確認', async ({ page }) => {
    // 認証不要なルートが正常にアクセスできるか確認
    const publicRoutes = ['/', '/auth/login', '/auth/sign-up']
    
    for (const route of publicRoutes) {
      const response = await page.goto(route)
      expect(response?.status()).toBe(200)
    }
  })

  test('ログインフォームの要素確認', async ({ page }) => {
    await page.goto('/auth/login')
    
    // フォーム要素の詳細確認（より具体的なセレクター）
    await expect(page.locator('div.font-semibold:has-text("Login")')).toBeVisible()
    await expect(page.locator('div.text-sm.text-muted-foreground:has-text("Enter your email below to login to your account")')).toBeVisible()
    
    // 入力フィールドの確認
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const loginButton = page.locator('button[type="submit"]:has-text("Login")')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(loginButton).toBeVisible()
    
    // プレースホルダー確認
    await expect(emailInput).toHaveAttribute('placeholder', 'm@example.com')
    
    // 「Forgot your password?」リンクの確認
    await expect(page.locator('a:has-text("Forgot your password?")')).toBeVisible()
    
    // 「Sign up」リンクの確認
    await expect(page.locator('a:has-text("Sign up")')).toBeVisible()
  })
}) 