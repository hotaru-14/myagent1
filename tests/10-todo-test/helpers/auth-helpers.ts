// 認証テスト用のモックデータとヘルパー関数

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  email_confirmed_at: '2023-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated',
}

export const mockAuthSuccess = {
  data: { user: mockUser },
  error: null,
}

export const mockAuthError = {
  data: { user: null },
  error: { message: 'User not authenticated' },
}

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    updateUser: jest.fn(),
  },
}

// 認証成功をシミュレートするヘルパー
export const mockAuthenticatedUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthSuccess)
}

// 認証失敗をシミュレートするヘルパー
export const mockUnauthenticatedUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthError)
}

// ユーザーなしをシミュレートするヘルパー
export const mockNoUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
}

// モックをリセットするヘルパー
export const resetAuthMocks = () => {
  jest.clearAllMocks()
} 