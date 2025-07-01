import { render, screen } from '../helpers/test-utils'
import { 
  mockAuthenticatedUser, 
  mockUnauthenticatedUser, 
  resetAuthMocks 
} from '../helpers/auth-helpers'
import DashboardPage from '@/app/dashboard/page'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null,
      })),
    },
  })),
}))

const { createClient } = require('@/lib/supabase/server')

// モックの設定
jest.mock('@/lib/supabase/server')
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('認証済みユーザーにダッシュボードを表示', async () => {
    // モックされたSupabaseクライアントの設定
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { 
            user: { 
              id: '1', 
              email: 'test@example.com',
              created_at: '2023-01-01',
              updated_at: '2023-01-01',
            } 
          },
          error: null,
        }),
      },
    } as any)

    // コンポーネントをレンダリング
    const DashboardComponent = await DashboardPage()
    render(DashboardComponent)

    // ダッシュボードページの要素が表示されているか確認
    expect(screen.getByText('Your user details')).toBeInTheDocument()
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument()
    expect(screen.getByText('This is a dashboard page that you can only see as an authenticated user')).toBeInTheDocument()
  })

  it('認証されていないユーザーはリダイレクトされる', async () => {
    const { redirect } = require('next/navigation')
    
    // 認証失敗をシミュレート
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'User not authenticated' },
        }),
      },
    } as any)

    // コンポーネントを実行
    await DashboardPage()

    // リダイレクトが呼ばれたか確認
    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('ユーザーデータなしの場合もリダイレクトされる', async () => {
    const { redirect } = require('next/navigation')
    
    // ユーザーデータなしをシミュレート
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any)

    // コンポーネントを実行
    await DashboardPage()

    // リダイレクトが呼ばれたか確認
    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })
}) 